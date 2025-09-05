import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AlicloudFileTranscriptionCredentialsApi implements ICredentialType {
	name = 'alicloudFileTranscriptionApi';
	displayName = 'Alicloud File Transcription API';
	documentationUrl = 'https://www.alibabacloud.com/help/zh/isi/developer-reference/api-reference-2';

	properties: INodeProperties[] = [
		{
			displayName: 'AccessKey ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Alibaba Cloud AccessKey ID for file transcription service authentication',
		},
		{
			displayName: 'AccessKey Secret',
			name: 'accessKeySecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Alibaba Cloud AccessKey Secret for file transcription service authentication',
		},
		{
			displayName: 'AppKey',
			name: 'appKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Intelligent Speech Service project AppKey, get it from: https://nls-portal.console.aliyun.com/applist',
		},
		{
			displayName: 'Endpoint',
			name: 'endpoint',
			type: 'string',
			default: 'http://filetrans.cn-beijing.aliyuncs.com',
			required: true,
			description: 'File transcription service endpoint address',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2018-08-17',
			required: true,
			description: 'API version number',
		},
	];
}
