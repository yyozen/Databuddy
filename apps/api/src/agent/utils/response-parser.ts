import type { z } from 'zod';
import { AIResponseJsonSchema } from '../prompts/agent';

export interface ParsedAIResponse {
	success: boolean;
	data?: z.infer<typeof AIResponseJsonSchema>;
	error?: string;
	rawResponse?: string;
}

export function parseAIResponse(rawResponse: string): ParsedAIResponse {
	try {
		const cleanedResponse = rawResponse
			.trim()
			.replace(/```json\n?/g, '')
			.replace(/```\n?/g, '');

		const parsedData = AIResponseJsonSchema.parse(JSON.parse(cleanedResponse));

		return {
			success: true,
			data: parsedData,
		};
	} catch (parseError) {
		return {
			success: false,
			error:
				parseError instanceof Error
					? parseError.message
					: 'Unknown parsing error',
			rawResponse,
		};
	}
}
