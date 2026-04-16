import sqlite3

# 连接数据库
conn = sqlite3.connect('volume-detail.db')
cursor = conn.cursor()

print('数据库连接成功')

# 查询红色日报表的前10条数据，查看publish_date字段
cursor.execute('SELECT id, title, year, month, publish_date FROM 红色日报 LIMIT 10')
rows = cursor.fetchall()

print('前10条数据的日期信息:')
for row in rows:
    id, title, year, month, publish_date = row
    print(f'ID: {id}, 标题: {title}, 年: {year}, 月: {month}, 发布日期: {publish_date}')

# 检查publish_date字段的格式
print('\n检查publish_date字段的格式:')
cursor.execute('SELECT publish_date FROM 红色日报 WHERE publish_date IS NOT NULL LIMIT 5')
dates = cursor.fetchall()
for date in dates:
    print(f'发布日期: {date[0]}')

# 关闭连接
conn.close()
print('\n数据库连接已关闭')