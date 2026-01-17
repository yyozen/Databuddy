import { Elysia } from "elysia";
import {
	EXPIRED_PAGE_HTML,
	NOT_FOUND_PAGE_HTML,
} from "../utils/status-page";

export const expiredRoute = new Elysia()
	.get("/expired", () => {
		return new Response(EXPIRED_PAGE_HTML, {
			status: 410,
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	})
	.get("/not-found", () => {
		return new Response(NOT_FOUND_PAGE_HTML, {
			status: 404,
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	});
