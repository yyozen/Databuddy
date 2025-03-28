/**
 * Migration script to update the analytics.events table schema
 * 
 * This script adds new columns to the existing analytics.events table
 * to better store the data collected by the enhanced databuddy.js client.
 */

import { clickHouse } from '@databuddy/db';
import { createLogger } from '@databuddy/logger';

const logger = createLogger('migration:events-schema');

async function migrateEventsSchema() {
  try {
    logger.info('Starting migration of analytics.events table schema');
    logger.info('-----------------------------------------------');
    
    // Define the new columns to add - we'll add them all without validation
    logger.info('Preparing columns to add');
    const newColumns = [
      { name: 'screen_resolution', type: 'String', defaultValue: '\'\'' },
      { name: 'viewport_size', type: 'String', defaultValue: '\'\'' },
      { name: 'language', type: 'String', defaultValue: '\'\'' },
      { name: 'timezone', type: 'String', defaultValue: '\'\'' },
      { name: 'timezone_offset', type: 'Nullable(Int16)', defaultValue: 'NULL' },
      { name: 'connection_type', type: 'String', defaultValue: '\'\'' },
      { name: 'connection_speed', type: 'String', defaultValue: '\'\'' },
      { name: 'rtt', type: 'Nullable(Int16)', defaultValue: 'NULL' },
      { name: 'time_on_page', type: 'Nullable(Float32)', defaultValue: 'NULL' },
      { name: 'page_count', type: 'Nullable(Int16)', defaultValue: 'NULL' },
      // Performance metrics
      { name: 'load_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'dom_ready_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'ttfb', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'redirect_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'domain_lookup_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'connection_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'request_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'render_time', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      // Web vitals
      { name: 'fcp', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'lcp', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      { name: 'cls', type: 'Nullable(Float32)', defaultValue: 'NULL' },
      { name: 'page_size', type: 'Nullable(Int32)', defaultValue: 'NULL' },
      // Page engagement metrics
      { name: 'scroll_depth', type: 'Nullable(Float32)', defaultValue: 'NULL' },
      { name: 'interaction_count', type: 'Nullable(Int16)', defaultValue: 'NULL' },
      { name: 'exit_intent', type: 'UInt8', defaultValue: '0' }
    ];
    logger.info(`Will attempt to add ${newColumns.length} columns one by one`);
    
    // Add columns one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const column of newColumns) {
      logger.info(`Adding column ${column.name} (${column.type})...`);
      
      // Create single column ALTER TABLE query
      const alterQuery = `
        ALTER TABLE analytics.events
        ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.defaultValue}
      `;
      
      try {
        await clickHouse.command({
          query: alterQuery,
          clickhouse_settings: {
            receive_timeout: 30,
            send_timeout: 30,
            connect_timeout: 30
          }
        });
        
        logger.info(`✓ Successfully added column ${column.name}`);
        successCount++;
      } catch (error) {
        logger.error(`Failed to add column ${column.name}: ${error instanceof Error ? error.message : String(error)}`);
        errorCount++;
        // Continue with next column
      }
    }
    
    logger.info('-----------------------------------------------');
    logger.info(`Migration completed: ${successCount} columns added, ${errorCount} failures`);
    
    return {
      success: true,
      message: `Events table schema migration completed with ${successCount} columns added and ${errorCount} failures`
    };
  } catch (error) {
    logger.error('-----------------------------------------------');
    logger.error('Error during migration:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the migration if this script is run directly
if (require.main === module) {
  migrateEventsSchema()
    .then(result => {
      if (result.success) {
        logger.info(result.message);
        process.exit(0);
      } else {
        logger.error(result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error during migration:', error);
      process.exit(1);
    });
}

export default migrateEventsSchema; 