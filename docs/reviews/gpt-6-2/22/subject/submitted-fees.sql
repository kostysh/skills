-- R-48: amounts are integer EUR cents. PostgreSQL integer division truncates
-- toward zero, so a negative odd amount needs a one-cent correction.
SELECT
    ref,
    net_minor::text AS net_minor,
    CASE
        WHEN kind = 'standard' THEN
            (net_minor / 2 - CASE WHEN net_minor % 2 = -1 THEN 1 ELSE 0 END)::text
        ELSE NULL
    END AS fee_minor
FROM batch_lines;
