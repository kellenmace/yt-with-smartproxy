import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SMARTPROXY_USERNAME, SMARTPROXY_PASSWORD } from '$env/static/private';

const url = 'https://ip.smartproxy.com/json';
const proxyAgent = new HttpsProxyAgent(
	`http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@gate.smartproxy.com:10001`
);

// Test URL: http://localhost:5173/api/smartproxy
export const GET: RequestHandler = async () => {
	const response = await axios.get(url, {
		httpsAgent: proxyAgent
	});

	return json(response.data);
};
