"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "pushDevSchema", {
    enumerable: true,
    get: function() {
        return pushDevSchema;
    }
});
const _drizzleorm = require("drizzle-orm");
const _prompts = /*#__PURE__*/ _interop_require_default(require("prompts"));
const _requireDrizzleKit = require("./requireDrizzleKit");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const pushDevSchema = async (adapter)=>{
    const { pushSchema } = (0, _requireDrizzleKit.requireDrizzleKit)();
    // This will prompt if clarifications are needed for Drizzle to push new schema
    const { apply, hasDataLoss, warnings } = await pushSchema(adapter.schema, adapter.drizzle, adapter.schemaName ? [
        adapter.schemaName
    ] : undefined);
    if (warnings.length) {
        let message = `Warnings detected during schema push: \n\n${warnings.join('\n')}\n\n`;
        if (hasDataLoss) {
            message += `DATA LOSS WARNING: Possible data loss detected if schema is pushed.\n\n`;
        }
        message += `Accept warnings and push schema to database?`;
        const { confirm: acceptWarnings } = await (0, _prompts.default)({
            name: 'confirm',
            type: 'confirm',
            initial: false,
            message
        }, {
            onCancel: ()=>{
                process.exit(0);
            }
        });
        // Exit if user does not accept warnings.
        // Q: Is this the right type of exit for this interaction?
        if (!acceptWarnings) {
            process.exit(0);
        }
    }
    await apply();
    const migrationsTable = adapter.schemaName ? `"${adapter.schemaName}"."payload_migrations"` : '"payload_migrations"';
    const { drizzle } = adapter;
    const result = await drizzle.execute(_drizzleorm.sql.raw(`SELECT * FROM ${migrationsTable} WHERE batch = '-1'`));
    const devPush = result.rows;
    if (!devPush.length) {
        await drizzle.execute(_drizzleorm.sql.raw(`INSERT INTO ${migrationsTable} (name, batch) VALUES ('dev', '-1')`));
    } else {
        await drizzle.execute(_drizzleorm.sql.raw(`UPDATE ${migrationsTable} SET updated_at = CURRENT_TIMESTAMP WHERE batch = '-1'`));
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsaXRpZXMvcHVzaERldlNjaGVtYS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzcWwgfSBmcm9tICdkcml6emxlLW9ybSdcbmltcG9ydCBwcm9tcHRzIGZyb20gJ3Byb21wdHMnXG5cbmltcG9ydCB0eXBlIHsgUG9zdGdyZXNBZGFwdGVyIH0gZnJvbSAnLi4vdHlwZXMuanMnXG5cbmltcG9ydCB7IHJlcXVpcmVEcml6emxlS2l0IH0gZnJvbSAnLi9yZXF1aXJlRHJpenpsZUtpdCdcblxuLyoqXG4gKiBQdXNoZXMgdGhlIGRldmVsb3BtZW50IHNjaGVtYSB0byB0aGUgZGF0YWJhc2UgdXNpbmcgRHJpenpsZS5cbiAqXG4gKiBAcGFyYW0ge1Bvc3RncmVzQWRhcHRlcn0gYWRhcHRlciAtIFRoZSBQb3N0Z3Jlc0FkYXB0ZXIgaW5zdGFuY2UgY29ubmVjdGVkIHRvIHRoZSBkYXRhYmFzZS5cbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSAtIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uY2UgdGhlIHNjaGVtYSBwdXNoIGlzIGNvbXBsZXRlLlxuICovXG5leHBvcnQgY29uc3QgcHVzaERldlNjaGVtYSA9IGFzeW5jIChhZGFwdGVyOiBQb3N0Z3Jlc0FkYXB0ZXIpID0+IHtcbiAgY29uc3QgeyBwdXNoU2NoZW1hIH0gPSByZXF1aXJlRHJpenpsZUtpdCgpXG5cbiAgLy8gVGhpcyB3aWxsIHByb21wdCBpZiBjbGFyaWZpY2F0aW9ucyBhcmUgbmVlZGVkIGZvciBEcml6emxlIHRvIHB1c2ggbmV3IHNjaGVtYVxuICBjb25zdCB7IGFwcGx5LCBoYXNEYXRhTG9zcywgd2FybmluZ3MgfSA9IGF3YWl0IHB1c2hTY2hlbWEoXG4gICAgYWRhcHRlci5zY2hlbWEsXG4gICAgYWRhcHRlci5kcml6emxlLFxuICAgIGFkYXB0ZXIuc2NoZW1hTmFtZSA/IFthZGFwdGVyLnNjaGVtYU5hbWVdIDogdW5kZWZpbmVkLFxuICApXG5cbiAgaWYgKHdhcm5pbmdzLmxlbmd0aCkge1xuICAgIGxldCBtZXNzYWdlID0gYFdhcm5pbmdzIGRldGVjdGVkIGR1cmluZyBzY2hlbWEgcHVzaDogXFxuXFxuJHt3YXJuaW5ncy5qb2luKCdcXG4nKX1cXG5cXG5gXG5cbiAgICBpZiAoaGFzRGF0YUxvc3MpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYERBVEEgTE9TUyBXQVJOSU5HOiBQb3NzaWJsZSBkYXRhIGxvc3MgZGV0ZWN0ZWQgaWYgc2NoZW1hIGlzIHB1c2hlZC5cXG5cXG5gXG4gICAgfVxuXG4gICAgbWVzc2FnZSArPSBgQWNjZXB0IHdhcm5pbmdzIGFuZCBwdXNoIHNjaGVtYSB0byBkYXRhYmFzZT9gXG5cbiAgICBjb25zdCB7IGNvbmZpcm06IGFjY2VwdFdhcm5pbmdzIH0gPSBhd2FpdCBwcm9tcHRzKFxuICAgICAge1xuICAgICAgICBuYW1lOiAnY29uZmlybScsXG4gICAgICAgIHR5cGU6ICdjb25maXJtJyxcbiAgICAgICAgaW5pdGlhbDogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBvbkNhbmNlbDogKCkgPT4ge1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICApXG5cbiAgICAvLyBFeGl0IGlmIHVzZXIgZG9lcyBub3QgYWNjZXB0IHdhcm5pbmdzLlxuICAgIC8vIFE6IElzIHRoaXMgdGhlIHJpZ2h0IHR5cGUgb2YgZXhpdCBmb3IgdGhpcyBpbnRlcmFjdGlvbj9cbiAgICBpZiAoIWFjY2VwdFdhcm5pbmdzKSB7XG4gICAgICBwcm9jZXNzLmV4aXQoMClcbiAgICB9XG4gIH1cblxuICBhd2FpdCBhcHBseSgpXG4gIGNvbnN0IG1pZ3JhdGlvbnNUYWJsZSA9IGFkYXB0ZXIuc2NoZW1hTmFtZVxuICAgID8gYFwiJHthZGFwdGVyLnNjaGVtYU5hbWV9XCIuXCJwYXlsb2FkX21pZ3JhdGlvbnNcImBcbiAgICA6ICdcInBheWxvYWRfbWlncmF0aW9uc1wiJ1xuXG4gIGNvbnN0IHsgZHJpenpsZSB9ID0gYWRhcHRlclxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRyaXp6bGUuZXhlY3V0ZShcbiAgICBzcWwucmF3KGBTRUxFQ1QgKiBGUk9NICR7bWlncmF0aW9uc1RhYmxlfSBXSEVSRSBiYXRjaCA9ICctMSdgKSxcbiAgKVxuXG4gIGNvbnN0IGRldlB1c2ggPSByZXN1bHQucm93c1xuXG4gIGlmICghZGV2UHVzaC5sZW5ndGgpIHtcbiAgICBhd2FpdCBkcml6emxlLmV4ZWN1dGUoXG4gICAgICBzcWwucmF3KGBJTlNFUlQgSU5UTyAke21pZ3JhdGlvbnNUYWJsZX0gKG5hbWUsIGJhdGNoKSBWQUxVRVMgKCdkZXYnLCAnLTEnKWApLFxuICAgIClcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBkcml6emxlLmV4ZWN1dGUoXG4gICAgICBzcWwucmF3KGBVUERBVEUgJHttaWdyYXRpb25zVGFibGV9IFNFVCB1cGRhdGVkX2F0ID0gQ1VSUkVOVF9USU1FU1RBTVAgV0hFUkUgYmF0Y2ggPSAnLTEnYCksXG4gICAgKVxuICB9XG59XG4iXSwibmFtZXMiOlsicHVzaERldlNjaGVtYSIsImFkYXB0ZXIiLCJwdXNoU2NoZW1hIiwicmVxdWlyZURyaXp6bGVLaXQiLCJhcHBseSIsImhhc0RhdGFMb3NzIiwid2FybmluZ3MiLCJzY2hlbWEiLCJkcml6emxlIiwic2NoZW1hTmFtZSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIm1lc3NhZ2UiLCJqb2luIiwiY29uZmlybSIsImFjY2VwdFdhcm5pbmdzIiwicHJvbXB0cyIsIm5hbWUiLCJ0eXBlIiwiaW5pdGlhbCIsIm9uQ2FuY2VsIiwicHJvY2VzcyIsImV4aXQiLCJtaWdyYXRpb25zVGFibGUiLCJyZXN1bHQiLCJleGVjdXRlIiwic3FsIiwicmF3IiwiZGV2UHVzaCIsInJvd3MiXSwicmFuZ2VNYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwibWFwcGluZ3MiOiI7Ozs7K0JBYWFBOzs7ZUFBQUE7Ozs0QkFiTztnRUFDQTttQ0FJYzs7Ozs7O0FBUTNCLE1BQU1BLGdCQUFnQixPQUFPQztJQUNsQyxNQUFNLEVBQUVDLFVBQVUsRUFBRSxHQUFHQyxJQUFBQSxvQ0FBaUI7SUFFeEMsK0VBQStFO0lBQy9FLE1BQU0sRUFBRUMsS0FBSyxFQUFFQyxXQUFXLEVBQUVDLFFBQVEsRUFBRSxHQUFHLE1BQU1KLFdBQzdDRCxRQUFRTSxNQUFNLEVBQ2ROLFFBQVFPLE9BQU8sRUFDZlAsUUFBUVEsVUFBVSxHQUFHO1FBQUNSLFFBQVFRLFVBQVU7S0FBQyxHQUFHQztJQUc5QyxJQUFJSixTQUFTSyxNQUFNLEVBQUU7UUFDbkIsSUFBSUMsVUFBVSxDQUFDLDBDQUEwQyxFQUFFTixTQUFTTyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUM7UUFFcEYsSUFBSVIsYUFBYTtZQUNmTyxXQUFXLENBQUMsdUVBQXVFLENBQUM7UUFDdEY7UUFFQUEsV0FBVyxDQUFDLDRDQUE0QyxDQUFDO1FBRXpELE1BQU0sRUFBRUUsU0FBU0MsY0FBYyxFQUFFLEdBQUcsTUFBTUMsSUFBQUEsZ0JBQU8sRUFDL0M7WUFDRUMsTUFBTTtZQUNOQyxNQUFNO1lBQ05DLFNBQVM7WUFDVFA7UUFDRixHQUNBO1lBQ0VRLFVBQVU7Z0JBQ1JDLFFBQVFDLElBQUksQ0FBQztZQUNmO1FBQ0Y7UUFHRix5Q0FBeUM7UUFDekMsMERBQTBEO1FBQzFELElBQUksQ0FBQ1AsZ0JBQWdCO1lBQ25CTSxRQUFRQyxJQUFJLENBQUM7UUFDZjtJQUNGO0lBRUEsTUFBTWxCO0lBQ04sTUFBTW1CLGtCQUFrQnRCLFFBQVFRLFVBQVUsR0FDdEMsQ0FBQyxDQUFDLEVBQUVSLFFBQVFRLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUM5QztJQUVKLE1BQU0sRUFBRUQsT0FBTyxFQUFFLEdBQUdQO0lBRXBCLE1BQU11QixTQUFTLE1BQU1oQixRQUFRaUIsT0FBTyxDQUNsQ0MsZUFBRyxDQUFDQyxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUVKLGdCQUFnQixtQkFBbUIsQ0FBQztJQUcvRCxNQUFNSyxVQUFVSixPQUFPSyxJQUFJO0lBRTNCLElBQUksQ0FBQ0QsUUFBUWpCLE1BQU0sRUFBRTtRQUNuQixNQUFNSCxRQUFRaUIsT0FBTyxDQUNuQkMsZUFBRyxDQUFDQyxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQUVKLGdCQUFnQixtQ0FBbUMsQ0FBQztJQUUvRSxPQUFPO1FBQ0wsTUFBTWYsUUFBUWlCLE9BQU8sQ0FDbkJDLGVBQUcsQ0FBQ0MsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFSixnQkFBZ0Isc0RBQXNELENBQUM7SUFFN0Y7QUFDRiJ9