/* Advanced PDF Studio: A4 landscape 2-up sheets with alternate full-sheet 180 degree rotation. */
(()=>{'use strict';
  const input=document.getElementById('imposePdfInput'), button=document.getElementById('imposePdfBuild');
  const status=document.getElementById('imposePdfStatus'),result=document.getElementById('imposePdfResult'),download=document.getElementById('imposePdfDownload');
  if(!input||!button||!status||!download)return;
  let objectUrl=null, busy=false;
  const setStatus=message=>{status.textContent=message};
  const generate=async()=>{
    if(!input.files?.[0]||busy)return;
    if(!window.PDFLib){setStatus('PDF library did not load. Check internet connection and reload.');return;}
    busy=true;button.disabled=true;result.hidden=true;
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
    setStatus('Arranging PDF pages for printing…');
    try{
      const file=input.files[0],src=await PDFLib.PDFDocument.load(await file.arrayBuffer());
      const count=src.getPageCount();if(!count)throw Error('This PDF contains no pages.');
      const dst=await PDFLib.PDFDocument.create();
      // ISO A4 landscape, PDF points. Each half occupies exactly 148.5 × 210 mm.
      const sheetW=841.8898,sheetH=595.2756,halfW=sheetW/2;
      const margin=15, footerH=25, font=await dst.embedFont(PDFLib.StandardFonts.Helvetica);
      const embedded=await dst.embedPdf(await file.arrayBuffer());
      for(let i=0;i<count;i+=2){
        const sheet=dst.addPage([sheetW,sheetH]);
        for(let j=0;j<2&&i+j<count;j++){
          const idx=i+j,source=embedded[idx],cw=halfW-2*margin,ch=sheetH-2*margin-footerH;
          const sw=source.width,sh=source.height;
          if(sw<=0||sh<=0)throw Error('Page '+(idx+1)+' has invalid dimensions.');
          const scale=Math.min(cw/sw,ch/sh),w=sw*scale,h=sh*scale;
          const centerX=j*halfW+halfW/2,centerY=margin+footerH+ch/2;
          // Keep both original pages in reading order and upright within this combined sheet.
          sheet.drawPage(source,{x:centerX-w/2,y:centerY-h/2,width:w,height:h});
        }
        // Number the resulting sheets, not their constituent original pages.
        const sheetNumber=String(Math.floor(i/2)+1),fontSize=11;
        const numberW=font.widthOfTextAtSize(sheetNumber,fontSize);
        sheet.drawText(sheetNumber,{x:(sheetW-numberW)/2,y:margin+5,size:fontSize,font,color:PDFLib.rgb(.16,.16,.16)});
        // Printed sheet 2, 4, 6 ... is rotated as a WHOLE, including its number.
        if((Math.floor(i/2)+1)%2===0)sheet.setRotation(PDFLib.degrees(180));
      }
      const bytes=await dst.save();objectUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
      download.href=objectUrl;download.download=file.name.replace(/\.pdf$/i,'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,55)+'_2up_A4_print.pdf';
      result.hidden=false;setStatus(`Ready: ${count} original pages → ${Math.ceil(count/2)} A4 landscape sheets. Every second combined sheet rotated 180°; one sheet number per A4 sheet.`);
      // Auto arrange and prepare the file, without triggering an unsolicited browser download.
    }catch(err){console.error('Advanced PDF Studio failed:',err);setStatus('Could not arrange PDF: '+(err?.message||String(err)))}
    finally{busy=false;button.disabled=!input.files?.length;}
  };
  input.addEventListener('change',()=>{button.disabled=!input.files?.length;result.hidden=true;if(input.files?.length)generate();});
  button.addEventListener('click',generate);
  window.addEventListener('pagehide',()=>{if(objectUrl)URL.revokeObjectURL(objectUrl)});
})();
