'use client';
import {Canvas,useThree} from '@react-three/fiber';
import {Float,OrbitControls,Stars} from '@react-three/drei';
import {CanvasTexture} from 'three';
import {Component,useEffect,useMemo,useSyncExternalStore,type ReactNode} from 'react';
function SceneFallback(){return <div className="low-detail" role="status">3D view unavailable. You can still enter the portfolio room using the button below.</div>}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<SceneFallback/>:this.props.children}
}
const motionQuery='(prefers-reduced-motion: reduce)';
function subscribeMotion(onChange:()=>void){
 const query=window.matchMedia(motionQuery);
 query.addEventListener('change',onChange);
 return()=>query.removeEventListener('change',onChange);
}
function prefersReducedMotion(){return window.matchMedia(motionQuery).matches}
function Building({x,z,height,color,onClick,label}:{x:number,z:number,height:number,color:string,onClick?:()=>void,label?:string}){
 const canvas=useThree(state=>state.gl.domElement);
 const labelTexture=useMemo(()=>{
  if(!label)return null;
  const surface=document.createElement('canvas');surface.width=512;surface.height=128;
  const context=surface.getContext('2d');if(!context)return null;
  context.font='40px Arial, sans-serif';context.fillStyle='#93fbed';context.textAlign='center';context.textBaseline='middle';context.fillText(label,256,64);
  return new CanvasTexture(surface);
 },[label]);
 useEffect(()=>()=>{labelTexture?.dispose()},[labelTexture]);
 return <group position={[x,0,z]}><mesh position={[0,height/2,0]} onClick={onClick} onPointerOver={e=>{if(onClick){e.stopPropagation();canvas.style.setProperty('cursor','pointer')}}} onPointerOut={()=>{canvas.style.setProperty('cursor','auto')}}><boxGeometry args={[1.5,height,1.5]}/><meshStandardMaterial color={color} metalness={.7} roughness={.22} emissive={color} emissiveIntensity={.12}/></mesh><mesh position={[0,.02,0]}><boxGeometry args={[1.7,.04,1.7]}/><meshBasicMaterial color="#36c9c5" /></mesh>{labelTexture&&<sprite position={[0,height+.48,0]} scale={[3.2,.8,1]}><spriteMaterial map={labelTexture} transparent depthTest={false}/></sprite>}</group>
}
function City({onEnter,reducedMotion}:{onEnter:()=>void,reducedMotion:boolean}){
 const buildings=useMemo(()=>Array.from({length:16},(_,i)=>({x:(i%4-1.5)*2.35,z:(Math.floor(i/4)-1.5)*2.35,height:1.1+(i*13%7)*.27})),[]);
 return <><color attach="background" args={['#04111c']}/><ambientLight intensity={.7}/><directionalLight position={[5,8,5]} intensity={1.7}/><Stars radius={80} depth={40} count={350} factor={2} fade speed={reducedMotion?0:.25}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.03,0]}><planeGeometry args={[30,30]}/><meshStandardMaterial color="#061b2b" metalness={.5} roughness={.5}/></mesh><gridHelper args={[30,30,'#2ed9cb','#15394c']}/>{buildings.map((p,i)=><Building key={i} {...p} color={i===5?'#1a9aa4':'#143c56'} label={i===5?'PORTFOLIO':undefined} onClick={i===5?onEnter:undefined}/>)}<Float enabled={!reducedMotion} speed={1} rotationIntensity={.12} floatIntensity={.45}><mesh position={[0,5,0]} onClick={onEnter}><icosahedronGeometry args={[.8,1]}/><meshStandardMaterial color="#35dfd5" emissive="#187c84" emissiveIntensity={.8} wireframe/></mesh></Float><OrbitControls enableDamping={!reducedMotion} enablePan={false} minDistance={6} maxDistance={23} minPolarAngle={.4} maxPolarAngle={Math.PI/2.15}/></>
}
export default function HolographicScene({onEnter}:{onEnter:()=>void}){const reducedMotion=useSyncExternalStore(subscribeMotion,prefersReducedMotion,()=>true);return <div className="scene" aria-label="Interactive 3D command center city"><SceneBoundary><Canvas fallback={<SceneFallback/>} frameloop={reducedMotion?'demand':'always'} dpr={[1,1.5]} camera={{position:[10,9,13],fov:49}} gl={{antialias:false,powerPreference:'low-power'}}><City onEnter={onEnter} reducedMotion={reducedMotion}/></Canvas></SceneBoundary></div>}
