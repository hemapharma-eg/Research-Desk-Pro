const regex1 = /,\s*(?=\})/g;
const regex2 = /\}\s*,/g;

let text = `
@article{key,
  year = {2019}
}
      ,
@article{key2,
`;
console.log(text.replace(regex1, '').replace(regex2, '}'));
