import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AlicloudAppCredentialsApi implements ICredentialType {
	name = 'alicloudAppCredentialsApi';
	displayName = 'Alicloud App Credentials API';
	documentationUrl = 'https://nls-portal.console.aliyun.com/applist';

	properties: INodeProperties[] = [
		{
			displayName: 'File Transcription AppKey',
			name: 'fileTranscriptionAppKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Intelligent Speech Service project AppKey (required for file transcription). Get it at: https://nls-portal.console.aliyun.com/applist.',
		},
	];
}
