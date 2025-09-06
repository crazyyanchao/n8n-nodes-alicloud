import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
// @ts-ignore
import Nls from 'alibabacloud-nls';
import RPCClient from '@alicloud/pop-core';

// Function to generate access token for Alibaba Cloud Speech Service
async function generateAccessToken(accessKeyId: string, accessKeySecret: string, endpoint: string, apiVersion: string): Promise<string> {
	const client = new RPCClient({
		accessKeyId: accessKeyId,
		accessKeySecret: accessKeySecret,
		endpoint: endpoint,
		apiVersion: apiVersion
	});

	try {
		const result = await client.request('CreateToken', {});
		if (result && typeof result === 'object' && 'Token' in result) {
			const tokenResult = result as { Token: { Id: string }; Message?: string };
			if (tokenResult.Token && tokenResult.Token.Id) {
				return tokenResult.Token.Id;
			} else {
				throw new Error(`Failed to get access token: ${tokenResult.Message || 'Unknown error'}`);
			}
		} else {
			throw new Error('Failed to get access token: Invalid response format');
		}
	} catch (error: any) {
		throw new Error(`Token generation failed: ${error.message}`);
	}
}

const SpeechSynthesizerOperate: ResourceOperations = {
	name: 'Synthesize Speech',
	value: 'speechSynthesizer:synthesize',
	description: 'Convert text to speech using Alibaba Cloud Speech Synthesizer',
	options: [
		{
			displayName: 'Credentials',
			name: 'credentials',
			type: 'options',
			options: [
				{
					name: 'Alicloud Credentials API',
					value: 'alicloudCredentialsApi',
				},
			],
			default: 'alicloudCredentialsApi',
			description: 'The credential that should be used for authentication',
		},
		{
			displayName: 'Service URL',
			name: 'serviceUrl',
			type: 'string',
			default: 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
			description: 'Speech synthesis service URL',
			required: true,
		},
		{
			displayName: 'Token Endpoint',
			name: 'tokenEndpoint',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: 'https://nls-meta.cn-shanghai.aliyuncs.com',
			description: 'Token generation endpoint URL',
			required: true,
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2019-02-28',
			description: 'API version for token generation',
			required: true,
		},
		{
			displayName: 'AppKey',
			name: 'appKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Intelligent Speech Service project AppKey. Get it at: https://nls-portal.console.aliyun.com/applist. Access token will be automatically generated using credentials.',
			required: true,
		},
		{
			displayName: 'Text to Synthesize',
			name: 'text',
			type: 'string',
			default: '',
			description: 'Text content to be synthesized into speech (UTF-8 encoding, max 300 characters)',
			required: true,
		},
		{
			displayName: 'Voice',
			name: 'voice',
			type: 'options',
			options: [
				{ name: 'Aijia', value: 'aijia' },
				{ name: 'Aijun', value: 'aijun' },
				{ name: 'Aimei', value: 'aimei' },
				{ name: 'Aiqi', value: 'aiqi' },
				{ name: 'Aiqing', value: 'aiqing' },
				{ name: 'Aitong', value: 'aitong' },
				{ name: 'Aixia', value: 'aixia' },
				{ name: 'Aiya', value: 'aiya' },
				{ name: 'Aiyu', value: 'aiyu' },
				{ name: 'Xiaoyun (Default)', value: 'xiaoyun' },
			],
			default: 'xiaoyun',
			description: 'Voice speaker for speech synthesis',
		},
		{
			displayName: 'Audio Format',
			name: 'format',
			type: 'options',
			options: [
				{ name: 'PCM', value: 'pcm' },
				{ name: 'WAV', value: 'wav' },
				{ name: 'MP3', value: 'mp3' },
			],
			default: 'pcm',
			description: 'Audio encoding format',
		},
		{
			displayName: 'Sample Rate',
			name: 'sampleRate',
			type: 'number',
			default: 16000,
			description: 'Audio sample rate in Hz',
		},
		{
			displayName: 'Volume',
			name: 'volume',
			type: 'number',
			default: 50,
			description: 'Volume level (0-100)',
			typeOptions: {
				minValue: 0,
				maxValue: 100,
			},
		},
		{
			displayName: 'Speech Rate',
			name: 'speechRate',
			type: 'number',
			default: 0,
			description: 'Speech rate (-500 to 500, where 0 is normal speed)',
			typeOptions: {
				minValue: -500,
				maxValue: 500,
			},
		},
		{
			displayName: 'Pitch Rate',
			name: 'pitchRate',
			type: 'number',
			default: 0,
			description: 'Pitch rate (-500 to 500)',
			typeOptions: {
				minValue: -500,
				maxValue: 500,
			},
		},
		{
			displayName: 'Enable Subtitle',
			name: 'enableSubtitle',
			type: 'boolean',
			default: false,
			description: 'Whether to enable word-level timestamp',
		},
		{
			displayName: 'Output Format',
			name: 'outputFormat',
			type: 'options',
			options: [
				{ name: 'Base64 Encoded Audio', value: 'base64' },
				{ name: 'Audio Buffer Info', value: 'buffer' },
				{ name: 'Audio File Path', value: 'file' },
			],
			default: 'base64',
			description: 'How to return the synthesized audio data',
		},
		{
			displayName: 'Output File Path',
			name: 'outputFilePath',
			type: 'string',
			default: './synthesized_audio.wav',
			description: 'File path to save the synthesized audio (only used when Output Format is "Audio File Path")',
			displayOptions: {
				show: {
					outputFormat: ['file'],
				},
			},
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		// Get all required parameters with error handling
		let serviceUrl: string;
		let tokenEndpoint: string;
		let apiVersion: string;
		let appKey: string;
		let credentials: { accessKeyId: string; accessKeySecret: string };
		let text: string;
		let voice: string;
		let format: string;
		let sampleRate: number;
		let volume: number;
		let speechRate: number;
		let pitchRate: number;
		let enableSubtitle: boolean;
		let outputFormat: string;
		let outputFilePath: string = '';

		try {
			serviceUrl = this.getNodeParameter('serviceUrl', index) as string;
			tokenEndpoint = this.getNodeParameter('tokenEndpoint', index) as string;
			apiVersion = this.getNodeParameter('apiVersion', index) as string;
			appKey = this.getNodeParameter('appKey', index) as string;
			credentials = await this.getCredentials('alicloudCredentialsApi') as {
				accessKeyId: string;
				accessKeySecret: string;
			};
			text = this.getNodeParameter('text', index) as string;
			voice = this.getNodeParameter('voice', index) as string;
			format = this.getNodeParameter('format', index) as string;
			sampleRate = this.getNodeParameter('sampleRate', index) as number;
			volume = this.getNodeParameter('volume', index) as number;
			speechRate = this.getNodeParameter('speechRate', index) as number;
			pitchRate = this.getNodeParameter('pitchRate', index) as number;
			enableSubtitle = this.getNodeParameter('enableSubtitle', index) as boolean;
			outputFormat = this.getNodeParameter('outputFormat', index) as string;

			// Only get outputFilePath if outputFormat is 'file'
			if (outputFormat === 'file') {
				outputFilePath = this.getNodeParameter('outputFilePath', index) as string;
			}
		} catch (error) {
			throw new Error(`Failed to get required parameters: ${error.message}`);
		}

		return new Promise(async (resolve, reject) => {
			try {
				// Generate access token
				const accessToken = await generateAccessToken(credentials.accessKeyId, credentials.accessKeySecret, tokenEndpoint, apiVersion);

				// Create SpeechSynthesizer instance
				const tts = new Nls.SpeechSynthesizer({
					url: serviceUrl,
					appkey: appKey,
					token: accessToken,
				});

				let audioData: Buffer[] = [];
				let metaInfo: any = null;
				let isCompleted = false;
				let hasError = false;

				// Set up event handlers
				tts.on('meta', (msg: string) => {
					metaInfo = JSON.parse(msg);
					this.logger.debug('Received meta info:', metaInfo);
				});

				tts.on('data', (data: Buffer) => {
					audioData.push(data);
					this.logger.debug(`Received audio data chunk: ${data.length} bytes`);
				});

				tts.on('completed', (msg: string) => {
					isCompleted = true;
					this.logger.debug('Speech synthesis completed', { message: msg });

					// Process the audio data based on output format
					const fullAudioBuffer = Buffer.concat(audioData);

					let result: IDataObject = {
						success: true,
						message: 'Speech synthesis completed successfully',
						text: text,
						voice: voice,
						format: format,
						sampleRate: sampleRate,
						audioSize: fullAudioBuffer.length,
						metaInfo: metaInfo,
					};

					if (outputFormat === 'base64') {
						result.audioData = fullAudioBuffer.toString('base64');
					} else if (outputFormat === 'buffer') {
						result.audioBuffer = {
							length: fullAudioBuffer.length,
							type: format,
							sampleRate: sampleRate,
						};
					} else if (outputFormat === 'file') {
						// Save to file
						const fs = require('fs');
						fs.writeFileSync(outputFilePath, fullAudioBuffer);
						result.filePath = outputFilePath;
					}

					resolve(result);
				});

				tts.on('closed', () => {
					this.logger.debug('Connection closed');
					if (!isCompleted && !hasError) {
						reject(new Error('Connection closed unexpectedly'));
					}
				});

				tts.on('failed', (msg: string) => {
					hasError = true;
					this.logger.error('Speech synthesis failed', { message: msg });
					reject(new Error(`Speech synthesis failed: ${msg}`));
				});

				// Set up synthesis parameters
				const param = tts.defaultStartParams();
				param.text = text;
				param.voice = voice;
				param.format = format;
				param.sample_rate = sampleRate;
				param.volume = volume;
				param.speech_rate = speechRate;
				param.pitch_rate = pitchRate;
				param.enable_subtitle = enableSubtitle;

				// Start synthesis
				tts.start(param, true, 6000).catch((error: Error) => {
					hasError = true;
					reject(new Error(`Failed to start speech synthesis: ${error.message}`));
				});

			} catch (error) {
				reject(new Error(`Speech synthesis error: ${error.message}`));
			}
		});
	},
};

export default SpeechSynthesizerOperate;
