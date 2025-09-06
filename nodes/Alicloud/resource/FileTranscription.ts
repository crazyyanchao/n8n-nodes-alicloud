/*
 * File Transcription Module
 * =====================================================================
 * File Transcription Function Module
 * ---------------------------------------------------------------------
 * Supported Operations:
 *   • Submit transcription task (submit)
 *   • Query transcription result (query)
 *   • Complete workflow (complete)
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑01‑06
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';

export interface FileTranscriptionCredentials {
	accessKeyId: string;
	accessKeySecret: string;
}

export interface FileTranscriptionTask {
	appkey: string;
	file_link: string;
	version: string;
	enable_words: boolean;
	enable_sample_rate_adaptive: boolean;
}

export class FileTranscriptionModule {
	constructor(private functions: IExecuteFunctions) {}

	async execute(itemIndex: number): Promise<INodeExecutionData> {
		const credentials = (await this.functions.getCredentials('alicloudCredentialsApi')) as FileTranscriptionCredentials;
		const operation = this.functions.getNodeParameter('fileTranscriptionOperation', itemIndex) as string;

		// Get configuration from node parameters
		const endpoint = this.functions.getNodeParameter('fileTranscriptionEndpoint', itemIndex) as string;
		const apiVersion = this.functions.getNodeParameter('fileTranscriptionApiVersion', itemIndex) as string;

		// Create Alibaba Cloud file transcription client
		const client = new Client({
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.accessKeySecret,
			endpoint: endpoint,
			apiVersion: apiVersion,
		});

		if (operation === 'submit') {
			return await this.submitTask(client, itemIndex);
		} else if (operation === 'query') {
			return await this.queryResult(client, itemIndex);
		} else if (operation === 'complete') {
			return await this.completeWorkflow(client, itemIndex);
		}

		throw new NodeOperationError(this.functions.getNode(), `Unknown file transcription operation: ${operation}`);
	}

	private async submitTask(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const taskConfigMode = this.functions.getNodeParameter('taskConfigMode', itemIndex) as string;
		const appKey = this.functions.getNodeParameter('fileTranscriptionAppKey', itemIndex) as string;

		let task: FileTranscriptionTask;
		if (taskConfigMode === 'json') {
			const taskJson = this.functions.getNodeParameter('taskJson', itemIndex) as string;
			try {
				task = JSON.parse(taskJson);
				task.appkey = appKey;
			} catch (error) {
				throw new NodeOperationError(this.functions.getNode(), 'Invalid task JSON format');
			}
		} else {
			const fileLink = this.functions.getNodeParameter('fileLink', itemIndex) as string;
			const version = this.functions.getNodeParameter('version', itemIndex) as string;
			const enableWords = this.functions.getNodeParameter('enableWords', itemIndex) as boolean;
			const enableSampleRateAdaptive = this.functions.getNodeParameter('enableSampleRateAdaptive', itemIndex) as boolean;

			task = {
				appkey: appKey,
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
		return {
			json: {
				success: response.StatusText === 'SUCCESS',
				statusText: response.StatusText,
				taskId: response.TaskId,
				response: response
			}
		};
	}

	private async queryResult(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const taskId = this.functions.getNodeParameter('taskId', itemIndex) as string;

		const taskIdParams = {
			TaskId: taskId,
		};

		const response = await client.getTaskResult(taskIdParams);
		return {
			json: {
				success: response.StatusText === 'SUCCESS' || response.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
				statusText: response.StatusText,
				taskId: taskId,
				result: response.Result,
				response: response
			}
		};
	}

	private async completeWorkflow(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const taskConfigMode = this.functions.getNodeParameter('taskConfigMode', itemIndex) as string;
		const pollInterval = this.functions.getNodeParameter('pollInterval', itemIndex) as number;
		const maxPollCount = this.functions.getNodeParameter('maxPollCount', itemIndex) as number;
		const appKey = this.functions.getNodeParameter('fileTranscriptionAppKey', itemIndex) as string;

		let task: FileTranscriptionTask;
		if (taskConfigMode === 'json') {
			const taskJson = this.functions.getNodeParameter('taskJson', itemIndex) as string;
			try {
				task = JSON.parse(taskJson);
				task.appkey = appKey;
			} catch (error) {
				throw new NodeOperationError(this.functions.getNode(), 'Invalid task JSON format');
			}
		} else {
			const fileLink = this.functions.getNodeParameter('fileLink', itemIndex) as string;
			const version = this.functions.getNodeParameter('version', itemIndex) as string;
			const enableWords = this.functions.getNodeParameter('enableWords', itemIndex) as boolean;
			const enableSampleRateAdaptive = this.functions.getNodeParameter('enableSampleRateAdaptive', itemIndex) as boolean;

			task = {
				appkey: appKey,
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
			return {
				json: {
					success: false,
					error: 'Failed to submit transcription task',
					statusText: submitResponse.StatusText,
					response: submitResponse
				}
			};
		}

		const taskId = submitResponse.TaskId;

		// Poll query results
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

				// Add timeout protection to prevent infinite waiting
				setTimeout(() => {
					clearInterval(pollTimer);
					reject(new Error('Polling timeout: Maximum time exceeded'));
				}, pollInterval * maxPollCount * 2);
			});
		};

		try {
			finalResult = await pollForResult();
		} catch (error) {
			return {
				json: {
					success: false,
					error: (error as Error).message,
					taskId: taskId,
					pollCount: pollCount
				}
			};
		}

		// Return final result
		return {
			json: {
				success: finalResult.StatusText === 'SUCCESS' || finalResult.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
				statusText: finalResult.StatusText,
				taskId: taskId,
				result: finalResult.Result,
				pollCount: pollCount,
				response: finalResult
			}
		};
	}
}
