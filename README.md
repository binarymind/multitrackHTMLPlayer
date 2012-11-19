## how to use

download the source code <a href="https://github.com/binarymind/multitrackHTMLPlayer/zipball/master">HERE</a>

in the index.html, replace all the blocs by the ones you want
  
``` html
<div class='audio-container'  name='Example with existing sources'>
  <audio name="fisrt source" url="./data/sample.ogg"></audio>
  <audio name="second source" url="./data/sample.ogg"></audio>
  <audio name="third source" url="./data/sample.ogg"></audio>
</div>
```   

* each bloc must have the class `audio-container` and a `name` attribute like shown above.
* audio track must have a `name` attribute and an `url` attribute (not src !) 
* all the audio tracks must be in the same domain than your webpage.
* If you want not to preload audio files, add the preload="none" to you audio-container div, exemple : 

``` html
<div class='audio-container'  name='Example with existing sources' preload="none">
  <audio name="fisrt source" url="./data/sample.ogg"></audio>
  <audio name="second source" url="./data/sample.ogg"></audio>
  <audio name="third source" url="./data/sample.ogg"></audio>
</div>
``` 

And that's all.. This seems more stable Under Firefox. Moreover if you open the page with a modern firefox you will have displayed the FFT of all the tracks beeing played.

## Display the FFT in firefox on local files (not website)
* in firefox go to the url <a target="_blank" href="about:config">about:config</a>
* search for the value : security.fileuri.strict_origin_policy
* set it to false and reboot firefox

## credits
this player has been designed by Bastien Liutkus 
www.binarymind.org and released under the terms of
the BSD license. don't hesitate to contact if you find any issue. 

please acknowledge when using it.
