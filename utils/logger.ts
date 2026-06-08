export class APILogger {
    private recentLogs : any[] = []

    logRequest(method: string, url: string, headers: Record<string , string>,body?: any){
        const LogEntry = {method,url,headers,body}
        this.recentLogs.push({type: 'Request Details', data: LogEntry})
    }
    logResponse(statudcode: number, body?: any){
        const LogEntry = {statudcode,body}
        this.recentLogs.push({type: 'Request Details', data: LogEntry})
    }
    getRecentLogs(){
        const logs = this.recentLogs.map(log =>{
            return `===${log.type}===\n${JSON.stringify(log.data,null,4)}`
        }).join('\n\n')
        return logs
    }
}