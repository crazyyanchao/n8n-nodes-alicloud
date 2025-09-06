/*
 * n8n Custom Node: Alicloud Services
 * =====================================================================
 * Dependencies
 * ---------------------------------------------------------------------
 * - Depends on official SDKs `@alicloud/nls-filetrans-2018-08-17` and `ali-oss`.
 * ---------------------------------------------------------------------
 * Supported Operations
 *   • File Transcription (Complete Workflow, Submit Task, Query Result)
 *   • OSS Signed URL Generation
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
	NodeOperationError,
} from 'n8n-workflow';

// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';
// @ts-ignore
import OSS from 'ali-oss';

/* -------------------------------------------------------------------
 * Node Implementation
 * ---------------------------------------------------------------- */
export class Alicloud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alicloud Services',
		name: 'alicloud',
		icon: 'file:./alicloud.logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Operate Alibaba Cloud services within n8n workflows (File Transcription & OSS Signed URL).',
		defaults: {
			name: 'Alicloud Services',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'alicloudFileTranscriptionApi',
				required: false,
			},
			{
				name: 'alicloudCredentialsApi',
				required: false,
			},
		],
		properties: [
			/* ------------------------------ General ------------------------------ */
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{
						name: 'File Transcription Actions',
						value: 'fileTranscriptionActions',
						action: 'File transcription operations complete workflow submit task query result',
						description: 'File transcription operations (complete workflow, submit task, query result)',
					},
					{
						name: 'OSS Signed Actions',
						value: 'ossSignedActions',
						action: 'Oss signed url generation operations',
						description: 'OSS signed URL generation operations',
					},
				],
				default: 'fileTranscriptionActions',
				noDataExpression: true,
			},
			{
				displayName: 'File Transcription Operation',
				name: 'fileTranscriptionOperation',
				type: 'options',
				options: [
					{ name: 'Complete Workflow', value: 'complete' },
					{ name: 'Submit Task Only', value: 'submit' },
					{ name: 'Query Result Only', value: 'query' },
				],
				default: 'complete',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
					},
				},
				description: 'Select the specific file transcription operation',
			},
			{
				displayName: 'OSS Signed Operation',
				name: 'ossSignedOperation',
				type: 'options',
				options: [
					{ name: 'Generate Signed URL', value: 'generate' },
				],
				default: 'generate',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				description: 'Select the specific OSS signed operation',
			},

			/* ------------------------------ File Transcription Parameters ------------------------------ */
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
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
					},
				},
			},
			{
				displayName: 'File Link',
				name: 'fileLink',
				type: 'string',
				description: 'Audio file link address to be transcribed',
				default: '',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['query'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['individual'],
					},
				},
			},
			{
				displayName: 'Task Parameters JSON',
				name: 'taskJson',
				type: 'json',
				description: 'JSON format configuration for task parameters',
				default: '{\n  "file_link": "your_file_link",\n  "version": "4.0",\n  "enable_words": false,\n  "enable_sample_rate_adaptive": true\n}',
				displayOptions: {
					show: {
						action: ['fileTranscriptionSubmit', 'fileTranscriptionComplete'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['complete'],
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
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['complete'],
					},
				},
			},

			/* ------------------------------ OSS Signed URL Parameters ------------------------------ */
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				description: 'Alibaba Cloud service endpoint address (e.g., OSS endpoint)',
				default: 'https://oss-cn-beijing-internal.aliyuncs.com',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				description: 'Alibaba Cloud region identifier',
				default: 'cn-beijing',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				description: 'The name of the OSS bucket',
				default: '',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				description: 'The key (path) of the object in the bucket (e.g., path/to/file.jpg)',
				default: '',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'HTTP Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'HEAD', value: 'HEAD' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
				default: 'GET',
				description: 'HTTP method for the signed URL',
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
			},
			{
				displayName: 'Expires (Seconds)',
				name: 'expires',
				type: 'number',
				description: 'URL expiration time in seconds',
				default: 3600,
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						action: ['ossSignedActions'],
					},
				},
				options: [
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'json',
						description: 'HTTP headers to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Query Parameters',
						name: 'params',
						type: 'json',
						description: 'Query parameters to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Slash Safe',
						name: 'slashSafe',
						type: 'boolean',
						description: 'Whether to enable slash escape protection in object key',
						default: false,
					},
					{
						displayName: 'Additional Headers',
						name: 'additionalHeaders',
						type: 'json',
						description: 'Additional headers to be signed (JSON format)',
						default: '{}',
					},
				],
			},
		],
	};

	/* ------------------------------ Execution Entry ------------------------------ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const action = this.getNodeParameter('action', i) as string;

			try {
				if (action === 'fileTranscriptionActions') {
					/* --------------------------- File Transcription Actions --------------------------- */
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

					const fileTranscriptionOperation = this.getNodeParameter('fileTranscriptionOperation', i) as string;

					if (fileTranscriptionOperation === 'submit') {
						/* --------------------------- Submit Transcription Task --------------------------- */
						const taskConfigMode = this.getNodeParameter('taskConfigMode', i) as string;

						let task: any;
						if (taskConfigMode === 'json') {
							const taskJson = this.getNodeParameter('taskJson', i) as string;
							task = JSON.parse(taskJson);
							// Ensure appkey is set from credentials
							task.appkey = credentials.appKey;
						} else {
							const fileLink = this.getNodeParameter('fileLink', i) as string;
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

					} else if (fileTranscriptionOperation === 'query') {
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

					} else if (fileTranscriptionOperation === 'complete') {
						/* --------------------------- Complete Transcription Workflow --------------------------- */
						const taskConfigMode = this.getNodeParameter('taskConfigMode', i) as string;
						const pollInterval = this.getNodeParameter('pollInterval', i) as number;
						const maxPollCount = this.getNodeParameter('maxPollCount', i) as number;

						let task: any;
						if (taskConfigMode === 'json') {
							const taskJson = this.getNodeParameter('taskJson', i) as string;
							task = JSON.parse(taskJson);
							// Ensure appkey is set from credentials
							task.appkey = credentials.appKey;
						} else {
							const fileLink = this.getNodeParameter('fileLink', i) as string;
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

				} else if (action === 'ossSignedActions') {
					/* --------------------------- OSS Signed URL Generation --------------------------- */
					const credentials = (await this.getCredentials('alicloudCredentialsApi')) as {
						accessKeyId: string;
						accessKeySecret: string;
					};

					const endpoint = this.getNodeParameter('endpoint', i) as string;
					const region = this.getNodeParameter('region', i) as string;
					const bucketName = this.getNodeParameter('bucketName', i) as string;
					const objectKey = this.getNodeParameter('objectKey', i) as string;
					const method = this.getNodeParameter('method', i) as string;
					const expires = this.getNodeParameter('expires', i) as number;
					const additionalOptions = this.getNodeParameter('additionalOptions', i) as any;

					// Create Alibaba Cloud OSS client
					const client = new OSS({
						accessKeyId: credentials.accessKeyId,
						accessKeySecret: credentials.accessKeySecret,
						endpoint: endpoint,
						region: region,
					});

					// Parse additional options
					let headers = {};
					let params = {};
					let slashSafe = false;
					let additionalHeaders = {};

					if (additionalOptions.headers) {
						try {
							headers = typeof additionalOptions.headers === 'string'
								? JSON.parse(additionalOptions.headers)
								: additionalOptions.headers;
						} catch (error) {
							throw new NodeOperationError(this.getNode(), 'Invalid headers JSON format');
						}
					}

					if (additionalOptions.params) {
						try {
							params = typeof additionalOptions.params === 'string'
								? JSON.parse(additionalOptions.params)
								: additionalOptions.params;
						} catch (error) {
							throw new NodeOperationError(this.getNode(), 'Invalid params JSON format');
						}
					}

					if (additionalOptions.slashSafe !== undefined) {
						slashSafe = additionalOptions.slashSafe;
					}

					if (additionalOptions.additionalHeaders) {
						try {
							additionalHeaders = typeof additionalOptions.additionalHeaders === 'string'
								? JSON.parse(additionalOptions.additionalHeaders)
								: additionalOptions.additionalHeaders;
						} catch (error) {
							throw new NodeOperationError(this.getNode(), 'Invalid additionalHeaders JSON format');
						}
					}

					// Generate signed URL
					const signedUrl = client.signatureUrl(objectKey, {
						method,
						expires,
						headers: Object.keys(headers).length > 0 ? headers : undefined,
						params: Object.keys(params).length > 0 ? params : undefined,
						slash_safe: slashSafe,
						additional_headers: Object.keys(additionalHeaders).length > 0 ? additionalHeaders : undefined,
					});

					returnData.push({
						json: {
							success: true,
							signedUrl: signedUrl,
							endpoint: endpoint,
							region: region,
							bucketName: bucketName,
							objectKey: objectKey,
							method: method,
							expires: expires,
							expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
							options: {
								headers,
								params,
								slashSafe,
								additionalHeaders,
							},
						},
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
