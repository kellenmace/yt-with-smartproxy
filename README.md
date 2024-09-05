# YouTube.js & Smartproxy Integration

## Setup

Clone this repo and `cd` into the root directory

Create a `.env.local` file that contains the env vars I sent you in Slack.

Run `npm install`, then `npm run dev`

## See Smartproxy working in isolation

Visit http://localhost:5173/api/smartproxy and confirm that the proxy is working. The city, country, IP address, etc. listed in the response should indicate that the request was routed through some far-away residential proxy.

The code for this API endpoint is here:
`src/routes/api/smartproxy/+server.ts`

You can see that `axios` is being used to make the request.

## See YouTube.js working in isolation

Visit http://localhost:5173/api/youtube-js?id=NhHi0OjHUMQ and confirm that YouTube.js is working. The response should include info about [this hilarious YouTube video](https://www.youtube.com/watch?v=NhHi0OjHUMQ), like this:

```json
{
	"basic_info": {
		"id": "NhHi0OjHUMQ",
		"channel_id": "UCT5qXmLacW_a4DE-3EgeOiQ",
		"title": "Tech CEOs Rank Web Browsers (AI Tier List)",
		"duration": 367,
		"keywords": ["arc", "arc browser", "the browser company", "browser"]
		// ...
	}
	// ...
}
```

The code for this API endpoint is here:
`src/routes/api/youtube-js/+server.ts`

## Try to integrate YouTube.js with Smartproxy

You can see that the `customFetch()` function in `src/routes/api/youtube-js/+server.ts` currently uses `Platform.shim.fetch();` to make the request. I was digging around in the YouTube.js codebase and saw that being used in [some places](https://github.dev/LuanRT/YouTube.js/blob/4fca6c354e5493c4d78802a813f7aa51ef0e2742/src/utils/Utils.ts#L229), so I thought I'd give it a try, and it turned out to work.

In that same function, you can see that I've commented out `fetch(input, init)`, which unfortunately does not work. I have no idea why, though! From what I can tell, `fetch()` and `Platform.shim.fetch()` should both ultimately be using the `fetch` built into Node.js while the app is running on my machine in development mode. I even tried doing some logging yesterday, as shown below, and both of those functions seem to yield the same results.

```ts
async function customFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	console.log('Using native fetch:');
	const nativeFetchResponse = await fetch(input, init);
	console.log('Native fetch status:', nativeFetchResponse.status);
	console.log('Native fetch headers:', [...nativeFetchResponse.headers]);

	console.log('Using Platform.shim.fetch:');
	const platformFetchResponse = await Platform.shim.fetch(input, init);
	console.log('Platform.shim.fetch status:', platformFetchResponse.status);
	console.log('Platform.shim.fetch headers:', [...platformFetchResponse.headers]);

	return platformFetchResponse; // Use the working fetch
}
```

I can only assume there is something different going when `fetch` performs the request vs. when `Platform.shim.fetch` does it. I'm struggling to identify what that is, though.

Originally, I thought I could just implement a custom fetch function that adheres to these types that the `fetch` option expects:

```ts
fetch?: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | undefined
```

...and that inside the function I'd be able to do whatever I need to, including making the request with `fetch` or `axios` and routing it through the proxy. That has not been the case, sadly!

Question for you:
Can the `fetch` built into Node.js even be used to fire off requests via a proxy? Or is it necessary to reach for `axios` or another library to do so?

I'd greatly appreciate any help you can give! Thank you :)

## Reference

The "Browser Usage" section of the https://www.npmjs.com/package/youtubei.js page provides some guidance on using YouTube.js with a proxy.

The YouTube.js `Platform` class (which is used in `src/routes/api/youtube-js/+server.ts`) is here:
https://github.dev/LuanRT/YouTube.js/blob/4fca6c354e5493c4d78802a813f7aa51ef0e2742/src/utils/Utils.ts#L13

The YouTube.js `PlatformShim` interface (which is used in the `Platform` class) is here:
https://github.dev/LuanRT/YouTube.js/blob/4fca6c354e5493c4d78802a813f7aa51ef0e2742/src/types/PlatformShim.ts
^ You can see that it has `export type FetchFunction = typeof fetch;` at the top, and `fetch: FetchFunction;` within the interface.

I found the following two GitHub issues on the YouTube.js repo that contain code snippets for proxy implementation. I'm not sure how well-written they are. They could be useful to refer to, though.
https://github.com/LuanRT/YouTube.js/issues/622
https://github.com/LuanRT/YouTube.js/issues/725
