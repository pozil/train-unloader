import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    input: 'src/index.js',
    output: [
        { file: pkg.main, format: 'cjs' },
        { file: pkg.module, format: 'es' }
    ],
    plugins: [babel(), nodeResolve()]
};
