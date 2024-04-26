export async function getStdin(): Promise<Buffer> { 
        return await new Promise(function(resolve, _reject) {
            process.stdin.on("data", function(data) {
                resolve(data);
            });
        });
}
