import sqlite3

# 连接数据库
conn = sqlite3.connect('volume-detail.db')
cursor = conn.cursor()

print('数据库连接成功')

# 获取所有表
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print('数据库表:', tables)

# 如果有表，尝试查询数据
if tables:
    for table in tables:
        table_name = table[0]
        print(f'\n表 {table_name} 的结构:')
        cursor.execute(f'PRAGMA table_info({table_name})')
        columns = cursor.fetchall()
        for column in columns:
            print(f'  {column[1]} ({column[2]})')
        
        # 尝试查询前5条数据
        try:
            cursor.execute(f'SELECT * FROM {table_name} LIMIT 5')
            rows = cursor.fetchall()
            print(f'表 {table_name} 的前5条数据:')
            for row in rows:
                print(f'  {row}')
        except Exception as e:
            print(f'查询表 {table_name} 时出错: {e}')

# 关闭连接
conn.close()
print('\n数据库连接已关闭')