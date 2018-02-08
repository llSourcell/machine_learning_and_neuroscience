%% Creates edges for every node
subjects = {'SIM03_B0.00T0.63','SIM03_B1.00T1.00'};

edges_ind = nchoosek(1:9, 2);

for s = 1:length(subjects),
    
    for n = 1:length(edges_ind),
        edges(n).SubjectID = subjects{s};
        edges(n).source = ['Channel ', num2str(edges_ind(n, 1))];
        edges(n).target = ['Channel ', num2str(edges_ind(n, 2))];
    end
    
    opt.FileName = ['edges_',subjects{s}, '_C2s_coh','.json'];
    savejson('', edges, opt)
end