const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const FPS=30,DUR=24,N=FPS*DUR;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+__dirname+'/scene.html');await p.evaluate(()=>document.fonts.ready);
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-crf','18','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',__dirname+'/video.tmp.mp4'],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
ff.stdin.end();await new Promise(r=>ff.on('close',c=>{if(c)process.exit(1);r()}));await b.close();
require('fs').renameSync(__dirname+'/video.tmp.mp4',__dirname+'/video.mp4');console.log('video ok')})()
