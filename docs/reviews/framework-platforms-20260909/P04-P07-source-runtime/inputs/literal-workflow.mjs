export const sideEffects=[]
const sendEmail=async(...args)=>{sideEffects.push({name:'sendEmail',args})}
const createTasks=async(...args)=>{sideEffects.push({name:'createTasks',args})}
export default [
{
  slug: 'onboardUser',
  inputSchema: [{ name: 'userId', type: 'text' }],
  handler: async ({ job, req }) => {
    const results = await job.runInlineTask({
      task: async ({ input }) => {
        // Step 1: Send welcome email
        await sendEmail(input.userId)
        return { output: { emailSent: true } }
      },
    })

    await job.runInlineTask({
      task: async () => {
        // Step 2: Create onboarding tasks
        await createTasks()
        return { output: { tasksCreated: true } }
      },
    })
  },
}
][0]
