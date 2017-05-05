var audio_file = new Audio('/tone.ogg')
audio_file.addEventListener('timeupdate', function(){
    var buffer = .52
    if(this.currentTime > this.duration - buffer){
        this.currentTime = 0
        //this.play()
    }}, false);
audio_file.play();