import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AlicloudCredentialsApi implements ICredentialType {
	name = 'alicloudCredentialsApi';
	displayName = 'Alicloud Credentials API';
	documentationUrl = 'https://ram.console.aliyun.com/overview';

	properties: INodeProperties[] = [
		{
			displayName: 'AccessKey ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			required: true,
			description: 'Alibaba Cloud AccessKey ID for general service authentication',
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
			description: 'Alibaba Cloud AccessKey Secret for general service authentication',
		},
	];
}
