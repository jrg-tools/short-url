package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if strings.Contains(request.Path, "/search") {
		return events.APIGatewayProxyResponse{
			Body:       request.QueryStringParameters["query"],
			StatusCode: 200,
		}, nil
	}

	return events.APIGatewayProxyResponse{
		Body:       fmt.Sprintf("[%s] %s", request.HTTPMethod, request.PathParameters["x"]),
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(HandleRequest)
}
