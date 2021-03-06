import React, {useState, useEffect} from 'react';
import {View, SafeAreaView, Button, StyleSheet, Text} from 'react-native';
import {RTCPeerConnection, RTCView, mediaDevices} from 'react-native-webrtc';
import io from "socket.io-client";

export default function WEBRtc({roomNumber}) {
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
   

  let isCaller, peerConnection;
  const socket = io("https://desolate-earth-25164.herokuapp.com/");
  // const socket = io("http://192.168.0.102:3000");
  

  const constraints = {
    audio: true,
    video:true
  };


/**
 * Getting ready for local stream 
 */
  const startLocalStream = () => {
      socket.emit('joinTheRoom', roomNumber);
  };

 

    socket.on('roomCreated', room=>{
      console.log('room created');
      
      mediaDevices.getUserMedia(constraints)
        .then(stream=>{
          setLocalStream(stream);
          localST = stream;
          isCaller = true;
        })
    });
  
    socket.on('roomJoined', room=>{
      console.log('room joined');
      mediaDevices.getUserMedia(constraints)
        .then(stream=>{
          setLocalStream(stream);
          socket.emit('ready', roomNumber)
        });
    });
  
   
   
useEffect(()=>{
    const configuration = {iceServers: [
      {'urls':'stun:stun.services.mozilla.com'},
      {'urls':'stun:stun.l.google.com:19302'}
    ]};


    socket.on('ready', room=>{
      if(isCaller){
        console.log('ready');
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.onicecandidate = onIceCandidate;
         peerConnection.iceConnectionState = (e)=>{
           console.log('iceConnectionState', e);
           
         }
        peerConnection.onaddstream = onAddStream;
        peerConnection.createOffer()
        .then(offer=>{
          return peerConnection.setLocalDescription(offer)
          .then(()=>{
            console.log('emit offer');
              socket.emit('offer',{
                type:'offer',
                sdp:offer,
                room: roomNumber
              });
            })
          })
      }
    });

    socket.on("offer",e=>{
      
        if(!isCaller){
          peerConnection = new RTCPeerConnection(configuration);
          console.log('offer');
          
          peerConnection.onicecandidate = onIceCandidate;
          peerConnection.onaddstream = onAddStream;
          peerConnection.iceConnectionState = (e)=>{
            console.log('iceConnectionState', e);
            
          }
          console.log('about to create answer');

          //accept offer from here(ready)
          peerConnection.setRemoteDescription(e)
          .then(()=>{
            return peerConnection.createAnswer()
            .then(answer=>{
              return peerConnection.setLocalDescription(answer)
              .then(()=>{
                console.log('emit answer', answer);
                  socket.emit('answer',{
                    type:'answer',
                    sdp: answer,
                    room: roomNumber
                }); 
              })
            })
          });
        }
        
      });



     
    function onAddStream(e){
      console.log('remote stream', e);
      if (e.stream && remoteStream !== e.stream) {
        console.log('remote stream', e.stream);
        
        setRemoteStream(e.stream);
      }
  };


    function onIceCandidate(event){
      console.log('ice candidate');
      
      if(event.candidate){
          console.log('sending ice candidate', event.candidate);
          
          socket.emit('candidate',{
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
              room: roomNumber
          });
      }
  }

    

  socket.on('candidate', e=>{
    console.log('candidate', isCaller);
    peerConnection.addIceCandidate(e);
    peerConnection.addStream(localStream);
  });

  socket.on('answer', e=>{
    console.log('answer',e);
    peerConnection.setRemoteDescription(e);
  });
  
  
});
   
  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.streamContainer}>
      <View style={styles.streamWrapper}>
          <View style={styles.localStream}>
            {localStream && <RTCView style={styles.rtc} streamURL={localStream.toURL()} />}
            {!localStream && <Button title="Tap to start" onPress={startLocalStream} />}
          </View>
          <View style={styles.rtcview}>
            {remoteStream && <RTCView style={styles.rtc} streamURL={remoteStream.toURL()} />}
          </View>
        </View>
        {/* {!!remoteStream ? <Button style={styles.toggleButtons} title="Click to stop call" onPress={closeStreams} disabled={!remoteStream} /> : localStream && <Button title="Click to start call" onPress={startCall}  />} */}
    </View>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#313131',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    width:'100%'
  },
  streamContainer:{
    backgroundColor: 'grey',
    // justifyContent: 'space-around',
    alignItems: 'center',
    height: '50%',
    width: '100%',
    flexDirection:'column'
  },
  streamWrapper:{
    backgroundColor: 'grey',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    flexDirection:'row'
  },
  roomTitle:{
    fontSize:20,
    paddingTop:20
  },
  rtcview: {
    width: '45%',
    height: '60%',
    borderColor:'#ccc',
    borderWidth:3,
    
  },
  rtc: {
    width: '100%',
    height: '100%',
  },
  localStream:{
    width: '45%',
    height: '60%',
    borderColor:'#ccc',
    borderWidth:3,
    display:'flex',
    alignItems:'center',
    flexDirection:'row',
    justifyContent:'space-around',
    
  }
});











// socket.on("ready",()=>{
    
//   if(isCaller){
//     console.log('ready');
//     localPC.onicecandidate = onIceCandidateLocal;
//     localPC.addStream(localST);
//     // localPC.onaddstream = onAddStream;

//     localPC.createOffer()
//      .then(offer=>{
//         localPC.setLocalDescription(offer)
//         .then(()=>{
//           remotePC.setRemoteDescription(localPC.localDescription);
          
//           console.log('ofer start');
//           socket.emit('offer',{
//             type:'offer',
//             sdp:offer.sdp,
//             room: roomNumber
//           });
//         });
//      }).catch(error=>{
//       console.log(error);
//   });
//   }
// });


// socket.on("offer",e=>{

//     if(!isCaller){
//       console.log('offer');
//         remotePC.onicecandidate = onIceCandidateRemote;
//         remotePC.onaddstream = onAddStream;
        
//         // remotePC.setRemoteDescription(localPC.localDescription);
//         remotePC.createAnswer().then(answer=>{
//             console.log('answer start');  
//               remotePC.setLocalDescription(answer)
//               .then(()=>{
//                   localPC.setRemoteDescription(remotePC.localDescription);
//                   socket.emit('answer',{
//                     type:'answer',
//                     sdp: answer.sdp,
//                     room: roomNumber
//                 }); 
//               });                 
//         }).catch(error=>{
//           console.log("answer error", error);
//       });
//       // console.log(`Answer from remotePC: ${answer.sdp}`);
//     }
    
// });
    
// function onIceCandidateLocal(e){
//   if (e.candidate) {
//         socket.emit('candidateLocal',{
//             type: 'candidateLocal',
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomNumber
//         });
//     }
// }

     
// function onIceCandidateRemote(e){
//   if (e.candidate) {
//         socket.emit('candidateRemote',{
//             type: 'candidateRemote',
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomNumber
//         });
//     }
// }

// socket.on('candidateLocal', e=>{
//   console.log('candidateLocal', e.candidate);
//   remotePC.addIceCandidate(e.candidate);
// });

// socket.on('candidateRemote', e=>{
//   console.log('candidateRemote');
//   localPC.addIceCandidate(e.candidate);
// });


// function onAddStream(e){
//   console.log('add remote stream', e.steram);
  
//   if (e.stream && remoteStream !== e.stream) {
//     setRemoteStream(e.stream);
//   }
// };


// socket.on('answer', e=>{
//   console.log('answer');
//   localPC.setRemoteDescription(remotePC.localDescription);
// });