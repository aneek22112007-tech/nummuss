import json

def handler(event, context):
    print("API Handler triggered", event.get("path"))
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "message": "Nummuss API",
            "path": event.get("path")
        })
    }
