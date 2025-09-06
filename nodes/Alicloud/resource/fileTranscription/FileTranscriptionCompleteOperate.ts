import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import AlicloudRequestUtils from '../../utils/AlicloudRequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';

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
			description: 'Intelligent Speech Service project AppKey (required for file transcription). Get it at: https://nls-portal.console.aliyun.com/applist.',
			required: true,
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
			default: '',
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
		const appKey = this.getNodeParameter('fileTranscriptionAppKey', index) as string;
		const endpoint = this.getNodeParameter('fileTranscriptionEndpoint', index) as string;
		const apiVersion = this.getNodeParameter('fileTranscriptionApiVersion', index) as string;
		const taskConfigMode = this.getNodeParameter('taskConfigMode', index) as string;
		const pollInterval = this.getNodeParameter('pollInterval', index) as number;
		const maxPollCount = this.getNodeParameter('maxPollCount', index) as number;

		let taskParams: IDataObject;

		if (taskConfigMode === 'json') {
			const taskJson = this.getNodeParameter('taskJson', index) as string;
			taskParams = JSON.parse(taskJson);
		} else {
			const fileLink = this.getNodeParameter('fileLink', index) as string;
			const version = this.getNodeParameter('version', index) as string;
			const enableWords = this.getNodeParameter('enableWords', index) as boolean;
			const enableSampleRateAdaptive = this.getNodeParameter('enableSampleRateAdaptive', index) as boolean;

			taskParams = {
				file_link: fileLink,
				version,
				enable_words: enableWords,
				enable_sample_rate_adaptive: enableSampleRateAdaptive,
			};
		}

		// 1. Submit task
		const task = {
			appkey: appKey,
			...taskParams,
		};

		const submitBody = {
			Task: JSON.stringify(task),
		};

		const submitResponse = await AlicloudRequestUtils.fileTranscriptionRequest.call(this, {
			method: 'POST',
			url: `${endpoint}/v${apiVersion}/transcription`,
			body: submitBody,
		});

		if (!submitResponse.TaskId) {
			throw new NodeOperationError(this.getNode(), 'Failed to submit transcription task');
		}

		const taskId = submitResponse.TaskId;

		// 2. Poll query results
		let pollCount = 0;
		while (pollCount < maxPollCount) {
			await new Promise(resolve => setTimeout(resolve, pollInterval));

			const queryResponse = await AlicloudRequestUtils.fileTranscriptionRequest.call(this, {
				method: 'GET',
				url: `${endpoint}/v${apiVersion}/transcription/${taskId}`,
			});

			if (queryResponse.StatusText === 'SUCCESS') {
				return {
					success: true,
					taskId,
					status: queryResponse.StatusText,
					result: queryResponse.Result,
					submitResponse,
					queryResponse,
				};
			} else if (queryResponse.StatusText === 'FAIL') {
				throw new NodeOperationError(this.getNode(), `Transcription task failed: ${queryResponse.StatusText}`);
			}

			pollCount++;
		}

		throw new NodeOperationError(this.getNode(), `Transcription task timeout, polled ${maxPollCount} times`);
	},
};

export default FileTranscriptionCompleteOperate;
