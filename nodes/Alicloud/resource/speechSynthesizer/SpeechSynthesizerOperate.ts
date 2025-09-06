import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
// @ts-ignore
import Nls from 'alibabacloud-nls';

const SpeechSynthesizerOperate: ResourceOperations = {
	name: 'Synthesize Speech',
	value: 'speechSynthesizer:synthesize',
	description: 'Convert text to speech using Alibaba Cloud Speech Synthesizer',
	options: [
		{
			displayName: 'Service URL',
			name: 'serviceUrl',
			type: 'string',
			default: 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
			description: 'Speech synthesis service URL',
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
			description: 'Intelligent Speech Service project AppKey. Get it at: https://nls-portal.console.aliyun.com/applist',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Access token for authentication. Get it from: https://help.aliyun.com/document_detail/450514.html',
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
				{ name: 'xiaoyun (default)', value: 'xiaoyun' },
				{ name: 'aixia', value: 'aixia' },
				{ name: 'aiqi', value: 'aiqi' },
				{ name: 'aitong', value: 'aitong' },
				{ name: 'aiya', value: 'aiya' },
				{ name: 'aiyu', value: 'aiyu' },
				{ name: 'aijia', value: 'aijia' },
				{ name: 'aijun', value: 'aijun' },
				{ name: 'aimei', value: 'aimei' },
				{ name: 'aiqing', value: 'aiqing' },
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
		const serviceUrl = this.getNodeParameter('serviceUrl', index) as string;
		const appKey = this.getNodeParameter('appKey', index) as string;
		const accessToken = this.getNodeParameter('accessToken', index) as string;
		const text = this.getNodeParameter('text', index) as string;
		const voice = this.getNodeParameter('voice', index) as string;
		const format = this.getNodeParameter('format', index) as string;
		const sampleRate = this.getNodeParameter('sampleRate', index) as number;
		const volume = this.getNodeParameter('volume', index) as number;
		const speechRate = this.getNodeParameter('speechRate', index) as number;
		const pitchRate = this.getNodeParameter('pitchRate', index) as number;
		const enableSubtitle = this.getNodeParameter('enableSubtitle', index) as boolean;
		const outputFormat = this.getNodeParameter('outputFormat', index) as string;
		const outputFilePath = this.getNodeParameter('outputFilePath', index) as string;

		return new Promise((resolve, reject) => {
			try {
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
