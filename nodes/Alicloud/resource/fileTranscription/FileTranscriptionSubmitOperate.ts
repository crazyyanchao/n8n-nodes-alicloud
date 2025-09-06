import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';

const FileTranscriptionSubmitOperate: ResourceOperations = {
	name: 'Submit Task',
	value: 'fileTranscription:submit',
	description: 'Submit file transcription task only',
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
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const credentials = await this.getCredentials('alicloudCredentialsApi') as {
			accessKeyId: string;
			accessKeySecret: string;
		};

		// Get parameters from node parameters
		const appKey = this.getNodeParameter('fileTranscriptionAppKey', index) as string;
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

		const taskParams = {
			Task: JSON.stringify(task),
		};

		const response = await client.submitTask(taskParams, { method: 'POST' });

		return {
			success: response.StatusText === 'SUCCESS',
			statusText: response.StatusText,
			taskId: response.TaskId,
			response: response
		};
	},
};

export default FileTranscriptionSubmitOperate;
