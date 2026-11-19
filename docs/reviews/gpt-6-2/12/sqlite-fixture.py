import sqlite3
def observe(limits, ages):
    conn=sqlite3.connect(':memory:')
    conn.execute('CREATE TABLE entries(store TEXT, citizen TEXT, age_days INTEGER)')
    for store in limits:
        conn.executemany('INSERT INTO entries VALUES(?,?,?)',[(store,'reader-'+str(i),days) for i,days in enumerate(ages)])
    def read():
        return {store:[{'reader':n,'age_days':d} for n,d in conn.execute('SELECT citizen,age_days FROM entries WHERE store=? ORDER BY age_days',(store,))] for store in limits}
    before=read()
    with conn:
        for store,days in limits.items():
            conn.execute('DELETE FROM entries WHERE store=? AND age_days>=?',(store,days))
    after=read()
    conn.close()
    return {'engine':'SQLite '+sqlite3.sqlite_version,'configured_days':limits,'before':before,'after_new_query':after}
