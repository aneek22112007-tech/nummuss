import json

def handler(event, context):
    print("Reason and Decide triggered")
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Decision made"})
    }
