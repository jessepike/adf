export function errorResponse(message) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
    };
}
