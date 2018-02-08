subjects = {'SIM03_B0.00T0.63','SIM03_B1.00T1.00'};

x = [0.6427876097, 0.984807753, 0.8660254038, 0.3420201433, -0.3420201433, -0.8660254038, -0.984807753, -0.6427876097, -2.449293598e-16];
y = [0.7660444431, 0.1736481777, -0.5, -0.9396926208, -0.9396926208, -0.5, 0.1736481777, 0.7660444431, 1];

for s = 1:length(subjects),
    for n = 1:length(x),
        nodes(n).SubjectID = subjects{s};
        nodes(n).name = ['Channel ', num2str(n)];
        nodes(n).x = x(n);
        nodes(n).y = y(n);
        nodes(n).fixed = 'true';
    end
    
    opt.FileName = ['channels_',subjects{s},'.json'];
    savejson('', nodes, opt)
end