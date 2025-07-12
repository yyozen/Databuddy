import { chQuery } from "@databuddy/db";
import type { SimpleQueryConfig, QueryRequest, CompiledQuery, Filter } from "./types";
import { FilterOperators, TimeGranularity } from "./types";
import { applyPlugins } from "./utils";

export class SimpleQueryBuilder {
    private config: SimpleQueryConfig;
    private request: QueryRequest;
    private websiteDomain?: string | null;

    constructor(config: SimpleQueryConfig, request: QueryRequest, websiteDomain?: string | null) {
        this.config = config;
        this.request = request;
        this.websiteDomain = websiteDomain;
    }

    private buildFilter(filter: Filter, index: number): { clause: string, params: Record<string, unknown> } {
        const key = `f${index}`;
        const operator = FilterOperators[filter.op];

        if (filter.op === 'like') {
            return {
                clause: `${filter.field} ${operator} {${key}:String}`,
                params: { [key]: `%${filter.value}%` }
            };
        }

        if (filter.op === 'in' || filter.op === 'notIn') {
            return {
                clause: `${filter.field} ${operator} {${key}:Array(String)}`,
                params: { [key]: Array.isArray(filter.value) ? filter.value : [filter.value] }
            };
        }

        return {
            clause: `${filter.field} ${operator} {${key}:String}`,
            params: { [key]: filter.value }
        };
    }

    private replaceDomainPlaceholders(sql: string): string {
        if (!this.websiteDomain) {
            return sql
                .replace(/domain\(referrer\) != '\{websiteDomain\}'/g, '1=1')
                .replace(/NOT domain\(referrer\) ILIKE '%.{websiteDomain}'/g, '1=1')
                .replace(/domain\(referrer\) NOT IN \('localhost', '127\.0\.0\.1'\)/g, '1=1');
        }

        return sql
            .replace(/\{websiteDomain\}/g, this.websiteDomain)
            .replace(/%.{websiteDomain}/g, `%.${this.websiteDomain}`);
    }

    private formatDateTime(dateStr: string): string {
        const parts = dateStr.split('.');
        return parts[0]?.replace('T', ' ') || dateStr;
    }

    compile(): CompiledQuery {
        if (this.config.customSql) {
            const sql = this.config.customSql(
                this.request.projectId,
                this.formatDateTime(this.request.from),
                this.formatDateTime(this.request.to),
                this.request.filters,
                this.request.timeUnit
            );
            return { sql, params: {} };
        }

        const params: Record<string, unknown> = {
            websiteId: this.request.projectId,
            from: this.formatDateTime(this.request.from),
            to: this.formatDateTime(this.request.to)
        };

        let sql = `SELECT ${this.config.fields?.join(', ') || '*'} FROM ${this.config.table}`;

        const whereClause = [
            ...(this.config.where || []),
            "client_id = {websiteId:String}",
            `${this.config.timeField || 'time'} >= parseDateTimeBestEffort({from:String})`,
            `${this.config.timeField || 'time'} <= parseDateTimeBestEffort({to:String})`
        ];

        if (this.request.filters) {
            this.request.filters.forEach((filter, i) => {
                if (this.config.allowedFilters?.includes(filter.field)) {
                    const { clause, params: filterParams } = this.buildFilter(filter, i);
                    whereClause.push(clause);
                    Object.assign(params, filterParams);
                }
            });
        }

        sql += ` WHERE ${whereClause.join(' AND ')}`;

        sql = this.replaceDomainPlaceholders(sql);

        const groupBy = this.request.groupBy || this.config.groupBy;
        if (groupBy?.length) {
            sql += ` GROUP BY ${groupBy.join(', ')}`;
        }

        const orderBy = this.request.orderBy || this.config.orderBy;
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        const limit = this.request.limit || this.config.limit;
        if (limit) {
            sql += ` LIMIT ${limit}`;
        }

        if (this.request.offset) {
            sql += ` OFFSET ${this.request.offset}`;
        }

        return { sql, params };
    }

    async execute(): Promise<Record<string, unknown>[]> {
        const { sql, params } = this.compile();
        const rawData = await chQuery(sql, params);
        return applyPlugins(rawData, this.config, this.websiteDomain);
    }
} 