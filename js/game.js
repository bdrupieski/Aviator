const Aviator = (function () {

    const colors = {
        red: 0xf25346,
        white: 0xd8d0d1,
        brown: 0x59332e,
        pink: 0xF5986E,
        brownDark: 0x23190f,
        blue: 0x68c3c0
    };

    let height;
    let width;

    let scene;
    let camera;
    let fieldOfView;
    let aspectRatio;
    let nearPlane;
    let farPlane;

    let renderer;
    let container;

    let hemisphereLight;
    let shadowLight;

    let sea;
    let sky;
    let airplane;

    let mousePosition = {x: 0, y: 0};

    function setup(gameElementId) {
        createScene(gameElementId);
        createLights();

        createPlane();
        createSea();
        createSky();

        document.addEventListener('mousemove', handleMouseMove, false);

        draw();
    }

    function draw() {
        renderer.render(scene, camera);
        updateScene();
        requestAnimationFrame(draw);
    }

    function updateScene() {
        updatePlane();
        sea.mesh.rotation.z += .005;
        sky.mesh.rotation.z += .01;
    }

    function createScene(gameElementId) {
        height = window.innerHeight;
        width = window.innerWidth;

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

        aspectRatio = width / height;
        fieldOfView = 60;
        nearPlane = 1;
        farPlane = 10000;
        camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.x = 0;
        camera.position.z = 200;
        camera.position.y = 100;

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;

        container = document.getElementById(gameElementId);
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', handleWindowResize, false);
    }

    function handleWindowResize() {
        height = window.innerHeight;
        width = window.innerWidth;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function handleMouseMove(event) {
        const tx = -1 + (event.clientX / width) * 2;
        const ty = 1 - (event.clientY / height) * 2;
        mousePosition = {x: tx, y: ty};
    }

    function updatePlane(){
        airplane.mesh.position.y = normalize(mousePosition.y, -1, 1, 25, 175);
        airplane.mesh.position.x = normalize(mousePosition.x, -1, 1, -100, 100);
        airplane.propeller.rotation.x += 0.3;
    }

    function normalize(v, vmin, vmax, tmin, tmax) {
        const nv = Math.max(Math.min(v, vmax), vmin);
        const dv = vmax - vmin;
        const pc = (nv - vmin) / dv;
        const dt = tmax - tmin;
        const tv = tmin + (pc * dt);
        return tv;
    }

    function createLights() {

        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

        shadowLight = new THREE.DirectionalLight(0xffffff, .9);
        shadowLight.position.set(150, 350, 350);
        shadowLight.castShadow = true;
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;

        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;

        scene.add(hemisphereLight);
        scene.add(shadowLight);
    }

    function Sea() {

        const geometry = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

        const material = new THREE.MeshPhongMaterial({
            color: colors.blue,
            transparent: true,
            opacity: .6,
            shading: THREE.FlatShading,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
    }

    function createSea() {
        sea = new Sea();
        sea.mesh.position.y = -600;
        scene.add(sea.mesh);
    }

    function Cloud() {
        this.mesh = new THREE.Object3D();

        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshPhongMaterial({
            color: colors.white,
        });

        const nBlocs = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nBlocs; i++) {

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = i * 15;
            mesh.position.y = Math.random() * 10;
            mesh.position.z = Math.random() * 10;
            mesh.rotation.z = Math.random() * Math.PI * 2;
            mesh.rotation.y = Math.random() * Math.PI * 2;

            const size = .1 + Math.random() * .9;
            mesh.scale.set(size, size, size);

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.mesh.add(mesh);
        }
    }

    function Sky() {
        this.mesh = new THREE.Object3D();
        this.numberOfClouds = 20;

        const stepAngle = Math.PI * 2 / this.numberOfClouds;

        // create the clouds
        for (let i = 0; i < this.numberOfClouds; i++) {
            const cloud = new Cloud();

            const a = stepAngle * i;
            const h = 750 + Math.random() * 200;

            cloud.mesh.position.y = Math.sin(a) * h;
            cloud.mesh.position.x = Math.cos(a) * h;

            cloud.mesh.rotation.z = a + Math.PI / 2;
            cloud.mesh.position.z = -400 - Math.random() * 400;

            const size = 1 + Math.random() * 2;
            cloud.mesh.scale.set(size, size, size);

            this.mesh.add(cloud.mesh);
        }
    }

    function createSky() {
        sky = new Sky();
        sky.mesh.position.y = -600;
        scene.add(sky.mesh);
    }

    function Airplane() {

        this.mesh = new THREE.Object3D();

        const geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
        const matCockpit = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);

        const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        const matEngine = new THREE.MeshPhongMaterial({color: colors.white, shading: THREE.FlatShading});
        const engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 40;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        const geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        const matTailPlane = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-35, 25, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        const geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
        const matSideWing = new THREE.MeshPhongMaterial({color: colors.red, shading: THREE.FlatShading});
        const sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        const matPropeller = new THREE.MeshPhongMaterial({color: colors.brown, shading: THREE.FlatShading});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
        const matBlade = new THREE.MeshPhongMaterial({color: colors.brownDark, shading: THREE.FlatShading});

        const blade = new THREE.Mesh(geomBlade, matBlade);
        blade.position.set(8, 0, 0);
        blade.castShadow = true;
        blade.receiveShadow = true;
        this.propeller.add(blade);
        this.propeller.position.set(50, 0, 0);
        this.mesh.add(this.propeller);
    }

    function createPlane() {
        airplane = new Airplane();
        airplane.mesh.scale.set(.25, .25, .25);
        airplane.mesh.position.y = 100;
        scene.add(airplane.mesh);
    }

    return {
        setup: setup
    };

})();
