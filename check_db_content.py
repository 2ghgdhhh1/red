import sqlite3

# 连接数据库
conn = sqlite3.connect('volume-detail.db')
cursor = conn.cursor()

print('数据库连接成功')

# 查询红色日报表的前5条数据，查看内容是否相同
cursor.execute('SELECT id, title, full_text FROM 红色日报 LIMIT 5')
rows = cursor.fetchall()

print('前5条数据的内容:')
for row in rows:
    id, title, full_text = row
    print(f'ID: {id}, 标题: {title}')
    print(f'内容前100个字符: {full_text[:100]}...')
    print('-' * 50)

# 检查是否所有记录都有相同的内容
cursor.execute('SELECT COUNT(DISTINCT full_text) FROM 红色日报')
distinct_content_count = cursor.fetchone()[0]
print(f'不同内容的数量: {distinct_content_count}')

# 检查是否所有记录都有相同的标题
cursor.execute('SELECT COUNT(DISTINCT title) FROM 红色日报')
distinct_title_count = cursor.fetchone()[0]
print(f'不同标题的数量: {distinct_title_count}')

# 关闭连接
conn.close()
print('\n数据库连接已关闭')