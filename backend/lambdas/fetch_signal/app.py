import json

def handler(event, context):
    print("Fetch Signal triggered")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Signal fetched"})
    }
