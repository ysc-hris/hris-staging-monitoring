import { defineStore } from 'pinia';
import { EC2Client, DescribeInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2';
import { SFNClient, StartExecutionCommand, ListExecutionsCommand, StopExecutionCommand } from '@aws-sdk/client-sfn';
import { useAuthStore } from './auth';

const config = __APP_CONFIG__;

export const useEC2Store = defineStore('ec2', {
  state: () => ({
    instances: [],
    loading: false,
    error: null,
    lastUpdated: null,
    cacheTimestamp: null,
  }),

  getters: {
    isCacheValid: (state) => {
      return state.cacheTimestamp && Date.now() - state.cacheTimestamp < config.CACHE_DURATION_MS;
    },
  },

  actions: {
    async fetchInstances(forceRefresh = false) {
      // Use cache if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid) {
        return this.instances;
      }

      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const ec2Client = new EC2Client({
          region: config.AWS_REGION,
          credentials: authStore.credentials,
        });

        const command = new DescribeInstancesCommand({});
        const response = await ec2Client.send(command);

        const ec2StepFunctionMapping = {
          'i-084ddd1da12ba4337': {
            'stepFunctionArn': config.STEP_FUNCTION_ARN,
            'frontendUrl': 'https://s1.yahshuahris.com',
            'backendUrl': 'https://s1-api.yahshuahris.com/superadmin',
          },
        }

        const instances = [];
        for (const reservation of response.Reservations || []) {
          for (const instance of reservation.Instances || []) {
            const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
            if (instance.State.Name === 'terminated' || !nameTag?.Value) {
              continue;
            }
            instances.push({
              id: instance.InstanceId,
              name: nameTag?.Value || 'Unnamed Instance',
              state: instance.State.Name,
              launchTime: instance.LaunchTime,
              stepFunctionArn: ec2StepFunctionMapping[instance.InstanceId]?.stepFunctionArn,
              frontendUrl: ec2StepFunctionMapping[instance.InstanceId]?.frontendUrl,
              backendUrl: ec2StepFunctionMapping[instance.InstanceId]?.backendUrl,
            });
          }
        }

        // Sort by name
        instances.sort((a, b) => a.name.localeCompare(b.name));

        this.instances = instances;
        this.lastUpdated = new Date();
        this.cacheTimestamp = Date.now();
      } catch (error) {
        console.error('Error fetching instances:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async startInstance(stepFunctionArn, waitTime = 180) {
      const authStore = useAuthStore();
      const sfnClient = new SFNClient({
        region: config.AWS_REGION,
        credentials: authStore.credentials,
      });

      const command = new StartExecutionCommand({
        stateMachineArn: stepFunctionArn,
        input: JSON.stringify({ waitTime }),
      });

      await sfnClient.send(command);

      // Refresh instances after 5 seconds
      setTimeout(() => {
        this.fetchInstances(true);
      }, 5000);
    },

    async stopInstance(instanceId) {
      const authStore = useAuthStore();
      
      // Attempt to cancel all RUNNING Step Functions executions related to this instance's state machine
      try {
        const relatedInstance = this.instances.find((inst) => inst.id === instanceId);
        const stepFunctionArn = relatedInstance?.stepFunctionArn;
        if (stepFunctionArn) {
          const sfnClient = new SFNClient({
            region: config.AWS_REGION,
            credentials: authStore.credentials,
          });

          const listCmd = new ListExecutionsCommand({
            stateMachineArn: stepFunctionArn,
            statusFilter: 'RUNNING',
          });
          const listResp = await sfnClient.send(listCmd);
          const executions = listResp.executions || [];

          for (const execution of executions) {
            const stopCmd = new StopExecutionCommand({
              executionArn: execution.executionArn,
              cause: 'Cancelled due to EC2 instance stop request',
            });
            await sfnClient.send(stopCmd);
          }
        }
      } catch (err) {
        console.error('Error cancelling Step Functions executions:', err);
        // Proceed to stop EC2 instance regardless of Step Functions result
      }

      const ec2Client = new EC2Client({
        region: config.AWS_REGION,
        credentials: authStore.credentials,
      });

      const command = new StopInstancesCommand({
        InstanceIds: [instanceId],
      });

      await ec2Client.send(command);

      // Refresh instances after 5 seconds
      setTimeout(() => {
        this.fetchInstances(true);
      }, 5000);
    },
  },
});
