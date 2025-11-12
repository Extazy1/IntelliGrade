import requests
import json
import os


def test_health():
    """测试健康检查"""
    response = requests.get("http://localhost:8001/health")
    print("健康检查:", response.json())


def test_text_chat():
    """测试纯文本聊天"""
    response = requests.post(
        "http://localhost:8001/api/chat/messages",
        json={
            "sessionId": "sess_test",
            "message": {
                "role": "user",
                "content": "你好，请介绍一下你自己"
            }
        }
    )
    print("纯文本聊天响应:")
    print(json.dumps(response.json(), ensure_ascii=False, indent=2))


def test_file_upload():
    """测试文件上传"""
    # 创建测试文件
    with open("test_document.txt", "w", encoding="utf-8") as f:
        f.write("""公司政策文档

员工福利：
- 年假：15天
- 病假：10天
- 加班：可调休或支付加班费

考勤制度：
- 工作时间：9:00-18:00
- 弹性工时：可申请
- 远程办公：每周最多2天""")

    # 上传文件并提问
    files = {'files': open('test_document.txt', 'rb')}
    data = {
        'sessionId': 'sess_test',
        'content': '公司的年假有多少天？'
    }

    response = requests.post(
        "http://localhost:8001/api/chat/messages",
        files=files,
        data=data
    )
    print("文件上传响应:")
    print(json.dumps(response.json(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    print("=== 开始API测试 ===")
    test_health()
    print("\n=== 测试纯文本聊天 ===")
    test_text_chat()
    print("\n=== 测试文件上传 ===")
    test_file_upload()