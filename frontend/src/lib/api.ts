export type RequestOptions = RequestInit & {
	query?: Record<string, string>;
};

interface ApiError<T = unknown> extends Error {
	status: number;
	data: T | null;
}

export async function api<T = unknown>(
	endpoint: string,
	options: RequestOptions = {},
	baseURL: string = ""
): Promise<T> {
	const devMode = process.env.NODE_ENV === "development";

	let preparedBaseURL = baseURL;
	if (baseURL && !baseURL.startsWith("http://") && !baseURL.startsWith("https://")) {
		preparedBaseURL = `https://${baseURL}`;
	}

	const url = new URL(endpoint, preparedBaseURL);

	if (devMode && url.host.includes("localhost:3000")) {
		url.host = url.host.replace("3000", "8000");
	}

	if (options.query) {
		url.search = new URLSearchParams(options.query).toString();
	}

	const response = await fetch(url.toString(), options);

	let responseData: T | null = null;
	try {
		responseData = await response.json();
	} catch {
		// ignore
	}

	if (response.ok) {
		return responseData as T;
	}

	const errorMessage =
		(responseData &&
			typeof responseData === "object" &&
			"message" in responseData &&
			typeof (responseData as Record<string, string>).message === "string")
			? (responseData as Record<string, string>).message
			: response.statusText || "Une erreur est survenue";

	const errorObj = new Error(errorMessage) as ApiError<T>;
	errorObj.status = response.status;
	errorObj.data = responseData;
	throw errorObj;

}