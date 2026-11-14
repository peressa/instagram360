/* Pixel geometry, including compatibility with previously saved object-position crops. */
function circleCropGeometry(state,imageWidth,imageHeight,diameter){
 const z=Math.max(1,Number(state.z)||1),scale=Math.max(diameter/imageWidth,diameter/imageHeight),baseW=imageWidth*scale,baseH=imageHeight*scale,width=baseW*z,height=baseH*z;
 const maxX=(width-diameter)/(2*diameter),maxY=(height-diameter)/(2*diameter);
 let panX=state.cropVersion===2?(Number(state.panX)||0):-(baseW-diameter)*(Number(state.panX)||0)*z/diameter;
 let panY=state.cropVersion===2?(Number(state.panY)||0):-(baseH-diameter)*(Number(state.panY)||0)*z/diameter;
 panX=Math.max(-maxX,Math.min(maxX,panX));panY=Math.max(-maxY,Math.min(maxY,panY));
 return {width,height,left:(diameter-width)/2+panX*diameter,top:(diameter-height)/2+panY*diameter,panX,panY,maxX,maxY};
}
