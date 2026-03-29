const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/metea/OneDrive/Desktop/makeDoc/frontend/src/app/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const mappings = {
    'bg-white': 'dark:bg-[#1e2532]',
    'bg-slate-50': 'dark:bg-[#111621]',
    'bg-surface': 'dark:bg-[#111621]',
    'text-slate-900': 'dark:text-white',
    'text-on-surface': 'dark:text-white',
    'text-slate-800': 'dark:text-slate-200',
    'text-slate-700': 'dark:text-slate-300',
    'text-slate-600': 'dark:text-slate-400',
    'text-slate-500': 'dark:text-slate-400',
    'text-on-surface-variant': 'dark:text-slate-400',
    'border-slate-100': 'dark:border-slate-800',
    'border-slate-200': 'dark:border-[#2e3645]',
    'border-slate-300': 'dark:border-slate-700',
    'border-slate-200/50': 'dark:border-[#2e3645]/50',
    'bg-slate-900': 'dark:bg-[#1e2532]',
    'bg-slate-800': 'dark:bg-[#1e2532]'
};

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    content = content.replace(/className=["']([^"']+)["']/g, (match, classStr) => {
        let classes = classStr.split(/\s+/);
        let newClasses = [...classes];
        Object.keys(mappings).forEach(key => {
            if (classes.includes(key)) {
                const darkPrefix = mappings[key].substring(0, mappings[key].indexOf('-', 5)); // e.g., "dark:bg", "dark:text"
                const hasExistingDark = classes.some(c => c.startsWith(darkPrefix));
                if (!hasExistingDark) {
                    newClasses.push(mappings[key]);
                }
            }
        });
        return `className="${newClasses.join(' ')}"`;
    });

    content = content.replace(/className=\{`([^`]+)`\}/g, (match, classStr) => {
        let linesOrWords = classStr.split(/\s+/);
        let newClasses = [...linesOrWords];
        Object.keys(mappings).forEach(key => {
            if (linesOrWords.includes(key)) {
                // handle string exact matches
                const darkPrefixParts = mappings[key].split('-');
                const darkPrefix = darkPrefixParts[0] + '-' + darkPrefixParts[1] ; // dark:bg or dark:text or dark:border
                
                // Very simplified check: if there is already a `dark:bg-` we don't add another
                const prefixType = darkPrefixParts[0].split(':')[1]; // 'bg', 'text', 'border'
                const hasExistingDark = linesOrWords.some(c => c.startsWith(`dark:${prefixType}`));
                if (!hasExistingDark) {
                    newClasses.push(mappings[key]);
                }
            }
        });
        return `className={\`${newClasses.join(' ')}\`}`;
    });

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log("Updated", file);
    }
});
