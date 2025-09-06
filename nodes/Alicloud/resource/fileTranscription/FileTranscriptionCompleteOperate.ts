import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';

const FileTranscriptionCompleteOperate: ResourceOperations = {
	name: 'Complete Workflow',
	value: 'fileTranscription:complete',
	description: 'File transcription complete workflow (submit task and wait for result)',
	options: [
		{
			displayName: 'File Transcription AppKey',
			name: 'fileTranscriptionAppKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Intelligent Speech Service project AppKey (required for file transcription). You can also configure this in the Alicloud App Credentials API credential. Get it at: https://nls-portal.console.aliyun.com/applist.',
		},
		{
			displayName: 'File Transcription Endpoint',
			name: 'fileTranscriptionEndpoint',
			type: 'string',
			default: 'http://filetrans.cn-beijing.aliyuncs.com',
			description: 'File transcription service endpoint address',
			required: true,
		},
		{
			displayName: 'File Transcription API Version',
			name: 'fileTranscriptionApiVersion',
			type: 'string',
			default: '2018-08-17',
			description: 'File transcription API version number',
			required: true,
		},
		{
			displayName: 'Task Parameter Configuration Mode',
			name: 'taskConfigMode',
			type: 'options',
			options: [
				{ name: 'Simple Settings', value: 'individual' },
				{ name: 'Advanced JSON', value: 'json' },
			],
			default: 'individual',
			description: 'Choose how to configure transcription parameters. For more details, see: https://help.aliyun.com/zh/isi/developer-reference/api-reference-2.',
		},
		{
			displayName: 'File Link',
			name: 'fileLink',
			type: 'string',
			description: 'Audio file link address to transcribe',
			default: 'https://gw.alipayobjects.com/os/bmw-prod/0574ee2e-f494-45a5-820f-63aee583045a.wav',
			displayOptions: {
				show: {
					taskConfigMode: ['individual'],
				},
			},
			required: true,
		},
		{
			displayName: 'Version',
			name: 'version',
			type: 'string',
			description: 'API version number',
			default: '4.0',
			displayOptions: {
				show: {
					taskConfigMode: ['individual'],
				},
			},
		},
		{
			displayName: 'Enable Word Information',
			name: 'enableWords',
			type: 'boolean',
			description: 'Whether to output word information, requires version 4.0',
			default: false,
			displayOptions: {
				show: {
					taskConfigMode: ['individual'],
				},
			},
		},
		{
			displayName: 'Enable Sample Rate Adaptive',
			name: 'enableSampleRateAdaptive',
			type: 'boolean',
			description: 'Whether to enable sample rate adaptive',
			default: true,
			displayOptions: {
				show: {
					taskConfigMode: ['individual'],
				},
			},
		},
		{
			displayName: 'Task Parameters JSON',
			name: 'taskJson',
			type: 'json',
			description: 'Task parameter configuration in JSON format',
			default: '{\n  "file_link": "your_file_link",\n  "version": "4.0",\n  "enable_words": false,\n  "enable_sample_rate_adaptive": true\n}',
			displayOptions: {
				show: {
					taskConfigMode: ['json'],
				},
			},
		},
		{
			displayName: 'Poll Interval (Milliseconds)',
			name: 'pollInterval',
			type: 'number',
			description: 'Polling interval time when querying results',
			default: 10000,
		},
		{
			displayName: 'Max Poll Count',
			name: 'maxPollCount',
			type: 'number',
			description: 'Maximum polling count to prevent infinite waiting',
			default: 60,
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const credentials = await this.getCredentials('alicloudCredentialsApi') as {
			accessKeyId: string;
			accessKeySecret: string;
		};

		// Get AppKey from credentials first, fallback to node parameters
		let appKey: string;
		try {
			const appCredentials = await this.getCredentials('alicloudAppCredentialsApi') as {
				fileTranscriptionAppKey: string;
			};
			appKey = appCredentials.fileTranscriptionAppKey;
		} catch (error) {
			// Fallback to node parameters if credentials not configured
			appKey = this.getNodeParameter('fileTranscriptionAppKey', index) as string;
		}

		// Ensure AppKey is provided
		if (!appKey) {
			throw new Error('File Transcription AppKey is required. Please configure it either in the Alicloud App Credentials API credential or in the node parameters.');
		}
		const endpoint = this.getNodeParameter('fileTranscriptionEndpoint', index) as string;
		const apiVersion = this.getNodeParameter('fileTranscriptionApiVersion', index) as string;

		// Create Alibaba Cloud file transcription client
		const client = new Client({
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.accessKeySecret,
			endpoint: endpoint,
			apiVersion: apiVersion,
		});

		const taskConfigMode = this.getNodeParameter('taskConfigMode', index) as string;
		const pollInterval = this.getNodeParameter('pollInterval', index) as number;
		const maxPollCount = this.getNodeParameter('maxPollCount', index) as number;

		let task: any;

		if (taskConfigMode === 'json') {
			const taskJson = this.getNodeParameter('taskJson', index) as string;
			task = JSON.parse(taskJson);
			// Ensure appkey is set from node parameters
			task.appkey = appKey;
		} else {
			const fileLink = this.getNodeParameter('fileLink', index) as string;
			const version = this.getNodeParameter('version', index) as string;
			const enableWords = this.getNodeParameter('enableWords', index) as boolean;
			const enableSampleRateAdaptive = this.getNodeParameter('enableSampleRateAdaptive', index) as boolean;

			task = {
				appkey: appKey,
				file_link: fileLink,
				version: version,
				enable_words: enableWords,
				enable_sample_rate_adaptive: enableSampleRateAdaptive,
			};
		}

		// 1. Submit task
		const taskParams = {
			Task: JSON.stringify(task),
		};

		const submitResponse = await client.submitTask(taskParams, { method: 'POST' });

		if (submitResponse.StatusText !== 'SUCCESS') {
			throw new NodeOperationError(this.getNode(), 'Failed to submit transcription task');
		}

		const taskId = submitResponse.TaskId;

		// 2. Poll query results using Promise-based approach similar to official SDK
		let pollCount = 0;
		let finalResult: any = null;

		const pollForResult = async (): Promise<any> => {
			return new Promise((resolve, reject) => {
				const pollTimer = setInterval(async () => {
					try {
						const taskIdParams = {
							TaskId: taskId,
						};

						const queryResponse = await client.getTaskResult(taskIdParams);
						pollCount++;

						if (queryResponse.StatusText === 'SUCCESS' || queryResponse.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT') {
							clearInterval(pollTimer);
							resolve(queryResponse);
						} else if (queryResponse.StatusText === 'RUNNING' || queryResponse.StatusText === 'QUEUEING') {
							// Continue polling
							if (pollCount >= maxPollCount) {
								clearInterval(pollTimer);
								reject(new Error('Polling timeout: Maximum polling count reached'));
							}
						} else {
							// Task failed
							clearInterval(pollTimer);
							resolve(queryResponse);
						}
					} catch (error) {
						clearInterval(pollTimer);
						reject(error);
					}
				}, pollInterval);
			});
		};

		try {
			finalResult = await pollForResult();
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Transcription task failed: ${(error as Error).message}`);
		}

		// Return the final result
		return {
			success: finalResult.StatusText === 'SUCCESS' || finalResult.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
			statusText: finalResult.StatusText,
			taskId: taskId,
			result: finalResult.Result,
			pollCount: pollCount,
			submitResponse: submitResponse,
			queryResponse: finalResult
		};
	},
};

export default FileTranscriptionCompleteOperate;
