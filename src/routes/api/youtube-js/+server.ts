import { json, error } from '@sveltejs/kit';
import { Innertube, Platform } from 'youtubei.js';
import type { RequestHandler } from './$types';

type YoutubeInfo = Awaited<ReturnType<InstanceType<typeof Innertube>['getInfo']>>;

async function customFetch(input: RequestInfo | URL, init?: RequestInit) {
	// This does not work
	// return fetch(input, init);

	// This works
	return Platform.shim.fetch(input, init);

	// TODO: Perform this request via the proxy
}

// Test URL: http://localhost:5173/api/youtube-js?id=NhHi0OjHUMQ
export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');

	if (!id) {
		error(400, 'A video ID must be provided.');
	}

	let youtube: Innertube;
	try {
		youtube = await Innertube.create({
			lang: 'en',
			location: 'US',
			fetch: customFetch
		});
	} catch (err) {
		console.error(`Failed to initialize YouTube client for video ${id}.`, err);
		error(500, 'Failed to initialize YouTube client.');
	}

	let info: YoutubeInfo;
	try {
		info = await youtube.getInfo(id);
	} catch (err) {
		console.error(`Failed to get info for video ${id}.`, err);
		error(404, 'Video not found.');
	}

	return json(info);
};
