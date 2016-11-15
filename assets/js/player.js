$(document).ready(function() {
    console.log('document ready!');	
	vidmain = document.getElementById('vid_main');	
	changeScreen('video');
                            
    //camera
    var audio_select = document.getElementById("audiosrc");
    var video_select = document.getElementById("videosrc");
    var pc1, pc2;
    var localstream;
    var sdpConstraints = {'optional': {'OfferToReceiveAudio':false,'OfferToReceiveVideo':false }};
    refreshSources();
    start();
    
    function refreshSources() {
        if (typeof MediaStreamTrack === 'undefined'){
            alert('This browser does not support MediaStreamTrack.');
        } else {
            MediaStreamTrack.getSources(gotSources);
        }            
    }
                
    function gotSources(sourceInfos) {
        var audio_count = 0;
        var video_count = 0;
        audio_select.innerHTML = '';
        video_select.innerHTML = '';
        for (var i = 0; i < sourceInfos.length; i++) {
            var option = document.createElement("option");
            option.value = sourceInfos[i].id;
            option.text = sourceInfos[i].label;
            if (sourceInfos[i].kind === 'audio') {
                audio_count++;
                if (option.text === '') {
                    option.text = 'Audio ' + audio_count;
                }
                audio_select.appendChild(option);
            } else if (sourceInfos[i].kind === 'video'){
                video_count++;
                if (option.text === '') {
                    option.text = 'Video ' + video_count;
                }
                video_select.appendChild(option);
            }
        }
        changeDevices();
    }

    function start() {
        changeDevices();
    }

    function changeDevices() {
        var audio_source = null;
        var video_source = null;
        if (audio_select.options.length > 0) {
            audio_source = audio_select.options[audio_select.selectedIndex].value;
            trace('selected audio_source :' + audio_source);
        }
        if (video_select.options.length > 0 ) {
            video_source = video_select.options[video_select.selectedIndex].value;
            trace('selected video_source :' + video_source);
        }
        setWebcamAndMic(audio_source, video_source);
    }

    function setWebcamAndMic(audio_source, video_source) {
        trace("Requesting local stream");
        getUserMedia({ audio: {optional: [{sourceId: audio_source}]},
            video: {optional: [{sourceId: video_source}]}
            }, gotStream, function() {});      
    }

    function gotStream(stream) {
        trace("Received local stream");		
        localstream = stream;	        
    }

    function caller() {
        trace("Starting call");
        videoTracks = localstream.getVideoTracks();
        audioTracks = localstream.getAudioTracks();
        if (videoTracks.length > 0) {
            trace('Using Video device: ' + videoTracks[0].label);
        }
        if (audioTracks.length > 0) {
            trace('Using Audio device: ' + audioTracks[0].label);
        }

        //var servers = null;
        var servers = "{'iceServers': [{ url: 'stun:stun.l.google.com:19302' },{ url: 'stun:stun1.l.google.com:19302' },{ url: 'stun:stun2.l.google.com:19302' },{ url: 'stun:stun3.l.google.com:19302' },{ url: 'stun:stun4.l.google.com:19302' },{ url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },{url: 'turn:numb.viagenie.ca',credential: 'muazkh',username: 'webrtc@live.com', secure:true},{url: 'turn:192.158.29.39:3478?transport=udp',credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',username: '28224511:1379330808', secure:true},{url: 'turn:192.158.29.39:3478?transport=tcp',credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',username: '28224511:1379330808', secure:true}]}";
        pc1 = new RTCPeerConnection(servers);
        trace("Created local peer connection object pc1");
        pc1.onicecandidate = iceCallback1;

        pc2 = new RTCPeerConnection(servers);
        trace("Created remote peer connection object pc2");
        pc2.onicecandidate = iceCallback2;
        pc2.onaddstream = gotRemoteStream;

        pc1.addStream(localstream);
        trace("Adding Local Stream to peer connection");
        pc1.createOffer(gotDescription1);
    }

    function gotDescription1(desc) {
        pc1.setLocalDescription(desc);
        trace("Offer from pc1 \n" + desc.sdp);
        pc2.setRemoteDescription(desc);
        pc2.createAnswer(gotDescription2, null, sdpConstraints);
    }

    function gotDescription2(desc) {
        pc2.setLocalDescription(desc);
        trace("Answer from pc2 \n" + desc.sdp);
        pc1.setRemoteDescription(desc);
    }

    function hangup() {
        trace("Ending call");
        localstream.stop();
        pc1.close();
        pc2.close();
        pc1 = null;
        pc2 = null;
    }

    function gotRemoteStream(e) {
        trace("Received remote stream");
    }
    
    function iceCallback1(event) {
        if (event.candidate) {
            pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
            trace("Local ICE candidate: \n" + event.candidate.candidate);
        }
    }

    function iceCallback2(event) {
        if (event.candidate) {
            pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
            trace("Remote ICE candidate: \n " + event.candidate.candidate);
        }
    } 
    
    peer  = new Peer(u_id+'_player',{host: 'www.bunver.com', port: 9000, path: '/peerjs', secure:true});	  
	
    // peer id assignment
    peer.on('open', function(id) {
        console.log('Peer ID: ' + id);
        setTimeout(function(){
            videoCall();
        }, 3000);       
    });

    function videoCall(){
        var o_id = u_id+'_cam';
        var call = peer.call(o_id, localstream);	
        console.log("video call started to: "+o_id);
        call.on('stream', function(stream) {
            attachMediaStream(vid_main, stream);
            console.log("video call established");            
        });		
    }		     
        
	function changeScreen(screen){
        switch (screen){
            case 'video':			
				$('#videos').show();
				$('#home').hide();
				$('#navbar').hide();
				$('#controls').hide();
				$("body").css("background-color","#000");			
            break;
		}
	}  
});	

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    } else {
       return results[1] || 0;
    }
}