import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import AlicloudRequestUtils from '../../utils/AlicloudRequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';

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
		const endpoint = this.getNodeParameter('fileTranscriptionEndpoint', index) as string;
		const apiVersion = this.getNodeParameter('fileTranscriptionApiVersion', index) as string;
		const taskId = this.getNodeParameter('taskId', index) as string;

		const response = await AlicloudRequestUtils.fileTranscriptionRequest.call(this, {
			method: 'GET',
			url: `${endpoint}/v${apiVersion}/transcription/${taskId}`,
		});

		return {
			success: true,
			taskId,
			status: response.StatusText,
			result: response.Result,
			response,
		};
	},
};

export default FileTranscriptionQueryOperate;
