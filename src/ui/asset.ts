/** URL for a file in /public, respecting the deployment base path. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
