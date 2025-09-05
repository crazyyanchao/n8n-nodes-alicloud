/*
 * n8n Custom Node: Alicloud File Transcription Control Node (based on @alicloud/nls-filetrans SDK)
 * =====================================================================
 * Dependencies
 * ---------------------------------------------------------------------
 * - Depends on official SDK `@alicloud/nls-filetrans`.
 * ---------------------------------------------------------------------
 * Supported Operations
 *   • FileTranscription
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑01‑06
 */

/* -------------------------------------------------------------------
 * Dependencies Import
 * ---------------------------------------------------------------- */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';

/* -------------------------------------------------------------------
 * Node Implementation
 * ---------------------------------------------------------------- */
export class AlicloudFileTranscription implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alicloud File Transcription',
		name: 'alicloudFileTranscription',
		icon: 'file:./alicloud-file-transcription.logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Operate Alibaba Cloud File Transcription within n8n workflows (ali-nls-filetrans SDK).',
		defaults: {
			name: 'Alicloud File Transcription',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'alicloudFileTranscriptionApi',
				required: true,
			},
		],
		properties: [
			/* ------------------------------ General ------------------------------ */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'File Transcription (Complete Workflow)', value: 'transcribe' },
					{ name: 'Submit Task Only', value: 'submit' },
					{ name: 'Query Result Only', value: 'query' },
				],
				default: 'transcribe',
				noDataExpression: true,
				description: 'Complete workflow includes task submission and automatic result polling',
			},
			{
				displayName: 'File Link',
				name: 'fileLink',
				type: 'string',
				description: 'Audio file link address to be transcribed',
				default: '',
				displayOptions: {
					show: {
						operation: ['submit', 'transcribe'],
						taskConfigMode: ['individual'],
					},
				},
				required: true,
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				description: 'Transcription task ID for querying results',
				default: '',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
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
				description: 'Choose how to configure transcription parameters',
				displayOptions: {
					show: {
						operation: ['submit', 'transcribe'],
					},
				},
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				description: 'API version number',
				default: '4.0',
				displayOptions: {
					show: {
						operation: ['submit', 'transcribe'],
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
						operation: ['submit', 'transcribe'],
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
						operation: ['submit', 'transcribe'],
						taskConfigMode: ['individual'],
					},
				},
			},
			{
				displayName: 'Task Parameters JSON',
				name: 'taskJson',
				type: 'json',
				description: 'JSON format configuration for task parameters',
				default: '{\n  "appkey": "your_app_key",\n  "file_link": "your_file_link",\n  "version": "4.0",\n  "enable_words": false,\n  "enable_sample_rate_adaptive": true\n}',
				displayOptions: {
					show: {
						operation: ['submit', 'transcribe'],
						taskConfigMode: ['json'],
					},
				},
			},
			{
				displayName: 'Polling Interval (Ms)',
				name: 'pollInterval',
				type: 'number',
				description: 'Polling interval time when querying results',
				default: 10000,
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
			},
			{
				displayName: 'Max Polling Count',
				name: 'maxPollCount',
				type: 'number',
				description: 'Maximum polling count to prevent infinite waiting',
				default: 60,
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
			},
		],
	};

	/* ------------------------------ Execution Entry ------------------------------ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('alicloudFileTranscriptionApi')) as {
			accessKeyId: string;
			accessKeySecret: string;
			appKey: string;
			endpoint: string;
			apiVersion: string;
		};

					// Create Alibaba Cloud file transcription client
		const client = new Client({
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.accessKeySecret,
			endpoint: credentials.endpoint,
			apiVersion: credentials.apiVersion,
		});

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				if (operation === 'submit') {
					/* --------------------------- Submit Transcription Task --------------------------- */
					const fileLink = this.getNodeParameter('fileLink', i) as string;
					const taskConfigMode = this.getNodeParameter('taskConfigMode', i) as string;

					let task: any;
					if (taskConfigMode === 'json') {
						const taskJson = this.getNodeParameter('taskJson', i) as string;
						task = JSON.parse(taskJson);
					} else {
						const version = this.getNodeParameter('version', i) as string;
						const enableWords = this.getNodeParameter('enableWords', i) as boolean;
						const enableSampleRateAdaptive = this.getNodeParameter('enableSampleRateAdaptive', i) as boolean;

						task = {
							appkey: credentials.appKey,
							file_link: fileLink,
							version: version,
							enable_words: enableWords,
							enable_sample_rate_adaptive: enableSampleRateAdaptive,
						};
					}

					const taskParams = {
						Task: JSON.stringify(task),
					};

					const response = await client.submitTask(taskParams, { method: 'POST' });
					returnData.push({
						json: {
							success: response.StatusText === 'SUCCESS',
							statusText: response.StatusText,
							taskId: response.TaskId,
							response: response
						}
					});

				} else if (operation === 'query') {
					/* --------------------------- Query Transcription Result --------------------------- */
					const taskId = this.getNodeParameter('taskId', i) as string;

					const taskIdParams = {
						TaskId: taskId,
					};

					const response = await client.getTaskResult(taskIdParams);
					returnData.push({
						json: {
							success: response.StatusText === 'SUCCESS' || response.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
							statusText: response.StatusText,
							taskId: taskId,
							result: response.Result,
							response: response
						}
					});

				} else if (operation === 'transcribe') {
					/* --------------------------- Complete Transcription Workflow --------------------------- */
					const fileLink = this.getNodeParameter('fileLink', i) as string;
					const taskConfigMode = this.getNodeParameter('taskConfigMode', i) as string;
					const pollInterval = this.getNodeParameter('pollInterval', i) as number;
					const maxPollCount = this.getNodeParameter('maxPollCount', i) as number;

					let task: any;
					if (taskConfigMode === 'json') {
						const taskJson = this.getNodeParameter('taskJson', i) as string;
						task = JSON.parse(taskJson);
					} else {
						const version = this.getNodeParameter('version', i) as string;
						const enableWords = this.getNodeParameter('enableWords', i) as boolean;
						const enableSampleRateAdaptive = this.getNodeParameter('enableSampleRateAdaptive', i) as boolean;

						task = {
							appkey: credentials.appKey,
							file_link: fileLink,
							version: version,
							enable_words: enableWords,
							enable_sample_rate_adaptive: enableSampleRateAdaptive,
						};
					}

											// Submit task
					const taskParams = {
						Task: JSON.stringify(task),
					};

					const submitResponse = await client.submitTask(taskParams, { method: 'POST' });

					if (submitResponse.StatusText !== 'SUCCESS') {
													returnData.push({
								json: {
									success: false,
									error: 'Failed to submit transcription task',
									statusText: submitResponse.StatusText,
									response: submitResponse
								}
							});
						continue;
					}

					const taskId = submitResponse.TaskId;

																// Poll query results using Promise-based approach similar to official SDK
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
						returnData.push({
							json: {
								success: false,
								error: (error as Error).message,
								taskId: taskId,
								pollCount: pollCount
							}
						});
						continue;
					}

					// Return the final result
					returnData.push({
						json: {
							success: finalResult.StatusText === 'SUCCESS' || finalResult.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
							statusText: finalResult.StatusText,
							taskId: taskId,
							result: finalResult.Result,
							pollCount: pollCount,
							response: finalResult
						}
					});
				}
			} catch (error) {
				const errMsg = (error as Error).message;
				if (this.continueOnFail()) {
					returnData.push({ json: { error: errMsg } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
