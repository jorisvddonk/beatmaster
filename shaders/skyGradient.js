/* global AFRAME */
/*
The MIT License

Copyright © 2015-2017 A-Frame authors.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

AFRAME.registerShader('skyGradient', {
  schema: {
    colorTop: { type: 'color', default: 'black', is: 'uniform' },
    colorBottom: { type: 'color', default: 'red', is: 'uniform' }
  },

  vertexShader: `
   varying vec3 vWorldPosition;

   void main() {

     vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
     vWorldPosition = worldPosition.xyz;

     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

   }

  `,

  fragmentShader: `
   uniform vec3 colorTop;
   uniform vec3 colorBottom;
   uniform vec3 sunPosition;

   varying vec3 vWorldPosition;

   void main()

   {
     vec3 pointOnSphere = normalize(vWorldPosition.xyz);
     float f = 1.0;
     f = sin((pointOnSphere.y+0.0) * 1.5);
     gl_FragColor = vec4(mix(colorBottom,colorTop, f ), 1.0);
   }`
});
