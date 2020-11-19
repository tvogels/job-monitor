const host = process.env.REACT_APP_GRAPHQL_HOST;
const port = process.env.REACT_APP_GRAPHQL_PORT;

export const GRAPHQL = `${port === "443" ? "https" : "http"}://${host}:${port}`;
