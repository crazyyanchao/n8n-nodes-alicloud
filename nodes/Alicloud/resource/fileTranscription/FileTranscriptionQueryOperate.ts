import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
// @ts-ignore
import Client from '@alicloud/nls-filetrans-2018-08-17';

const FileTranscriptionQueryOperate: ResourceOperations = {
	name: 'Query Result',
	value: 'fileTranscription:query',
	description: 'Query file transcription task result',
	options: [
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
			displayName: 'Task ID',
			name: 'taskId',
			type: 'string',
			description: 'Transcription task ID for querying results',
			default: '',
			required: true,
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const credentials = await this.getCredentials('alicloudCredentialsApi') as {
			accessKeyId: string;
			accessKeySecret: string;
		};

		// Get parameters from node parameters
		const endpoint = this.getNodeParameter('fileTranscriptionEndpoint', index) as string;
		const apiVersion = this.getNodeParameter('fileTranscriptionApiVersion', index) as string;

		// Create Alibaba Cloud file transcription client
		const client = new Client({
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.accessKeySecret,
			endpoint: endpoint,
			apiVersion: apiVersion,
		});

		const taskId = this.getNodeParameter('taskId', index) as string;

		const taskIdParams = {
			TaskId: taskId,
		};

		const response = await client.getTaskResult(taskIdParams);

		return {
			success: response.StatusText === 'SUCCESS' || response.StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT',
			statusText: response.StatusText,
			taskId: taskId,
			result: response.Result,
			response: response
		};
	},
};

export default FileTranscriptionQueryOperate;
